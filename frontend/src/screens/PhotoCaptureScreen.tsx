import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  NativePreviewView,
  VisionCamera,
  useCameraDevice,
  usePhotoOutput,
  type CameraDevice,
  type CapturePhotoCallbacks,
  CommonResolutions,
} from 'react-native-vision-camera';
import { callback } from 'react-native-nitro-modules';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import { addPhotoCheckpoint } from '@/features/session-tracking/liveSessionStore';
import { persistCheckpointPhotos } from '@/features/session-tracking/utils/persistCheckpointPhotos';
import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

const PIP_SIZE = 170;
const PIP_RIGHT = 17;
const PIP_TOP = 14;

const EMPTY_CALLBACKS: CapturePhotoCallbacks = {};

// ─── Shutter button ───────────────────────────────────────────────────────────

function ShutterButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <AnimatedPressable
      style={[s.shutterOuter, disabled && s.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Take photo"
    >
      <View style={s.shutterInner} />
    </AnimatedPressable>
  );
}

// ─── BeReal-style preview ─────────────────────────────────────────────────────

function BeRealPreview({
  selfieUri,
  progressUri,
  onSubmit,
  onRetake,
  isSubmitting,
  submitError,
}: {
  selfieUri: string;
  progressUri: string;
  onSubmit: () => void;
  onRetake: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const actionsStyle = useFadeUpEnter(staggerDelay(1));

  return (
    <View style={s.previewRoot}>
      <Image
        source={{ uri: progressUri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessibilityLabel="Cleanup progress photo"
      />

      <View style={[s.pip, { top: insets.top + PIP_TOP, right: PIP_RIGHT }]} pointerEvents="none">
        <Image
          source={{ uri: selfieUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Selfie"
        />
      </View>

      <SafeAreaView style={s.previewActions} edges={['bottom']}>
        <Animated.View style={[{ gap: 12 }, actionsStyle]}>
          {submitError ? (
            <Text style={s.errorText} accessibilityRole="alert">
              {submitError}
            </Text>
          ) : null}
          <AnimatedPressable
            style={s.retakeBtn}
            onPress={onRetake}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Retake photos"
          >
            <Text style={s.retakeBtnText}>Retake Photos</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.submitBtn, isSubmitting && s.disabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Submit photos"
          >
            <Text style={s.submitBtnText}>
              {isSubmitting ? 'Saving…' : 'Submit'}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Option A: simultaneous dual-camera via VisionCamera v5 session API ───────


const PHOTO_OUTPUT_OPTIONS = {
  targetResolution: CommonResolutions.FHD_4_3,
  containerFormat: 'native' as const,
  quality: 0.9,
  qualityPrioritization: 'balanced' as const,
};

function DualCapture({
  onDone,
  onCancel,
  onFallbackSequential,
}: {
  onDone: (progressUri: string, selfieUri: string) => void;
  onCancel: () => void;
  /** Called when the dual session fails to start or capture (device limitation). */
  onFallbackSequential: () => void;
}) {
  // Create outputs synchronously via useMemo — same pattern as usePreviewOutput()
  // and usePhotoOutput(). This ensures NativePreviewView always receives a stable
  // JSI reference from its very first render, never triggering the folly::dynamic
  // prop serialization path that crashes on HybridObject values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backPreviewOutput = useMemo<any>(() => VisionCamera.createPreviewOutput(), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frontPreviewOutput = useMemo<any>(() => VisionCamera.createPreviewOutput(), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backPhotoOutput = useMemo<any>(() => VisionCamera.createPhotoOutput(PHOTO_OUTPUT_OPTIONS), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frontPhotoOutput = useMemo<any>(() => VisionCamera.createPhotoOutput(PHOTO_OUTPUT_OPTIONS), []);

  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const sessionRef = useRef<any>(null);
  const fellBackRef = useRef(false);
  const insets = useSafeAreaInsets();

  // hybridRef callbacks — set previewOutput imperatively via JSI after mount.
  // Passing previewOutput as a React prop goes through Fabric's folly::dynamic
  // serialization (UIManager::createNode → HybridPreviewViewProps(folly::dynamic))
  // which cannot represent a Nitro HybridObject → RawValue::castValue → SIGABRT.
  // Mounting WITHOUT the prop leaves rawProps.at("previewOutput") == nullptr (safe),
  // then setting ref.previewOutput = output calls setPreviewOutput() directly via JSI.
  const onBackRef = useMemo(
    () =>
      callback((ref: any) => {
        if (ref) ref.previewOutput = backPreviewOutput;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const onFrontRef = useMemo(
    () =>
      callback((ref: any) => {
        if (ref) ref.previewOutput = frontPreviewOutput;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fallback = (reason: unknown) => {
    if (fellBackRef.current) return;
    fellBackRef.current = true;
    console.warn('[DualCapture] Falling back to sequential capture:', reason);
    onFallbackSequential();
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const deviceFactory = await VisionCamera.createDeviceFactory();
        const combination = (
          deviceFactory.supportedMultiCamDeviceCombinations as CameraDevice[][]
        ).find(
          (devices) =>
            devices.some((d) => d.position === 'front') &&
            devices.some((d) => d.position === 'back')
        );

        if (!combination) {
          fallback('No compatible front+back camera combination');
          return;
        }

        // Safe: combination is guaranteed to contain both positions above
        const frontDevice = combination.find((d) => d.position === 'front')!;
        const backDevice = combination.find((d) => d.position === 'back')!;

        const session = await VisionCamera.createCameraSession(true);
        await session.configure([
          {
            input: frontDevice,
            outputs: [
              { output: frontPreviewOutput, mirrorMode: 'on' },
              { output: frontPhotoOutput, mirrorMode: 'off' },
            ],
            constraints: [],
          },
          {
            input: backDevice,
            outputs: [
              { output: backPreviewOutput, mirrorMode: 'off' },
              { output: backPhotoOutput, mirrorMode: 'off' },
            ],
            constraints: [],
          },
        ]);

        await session.start();

        if (!cancelled) {
          sessionRef.current = session;
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) fallback(err);
      }
    })();

    return () => {
      cancelled = true;
      void sessionRef.current?.stop?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureSimultaneous = async () => {
    if (!ready || capturing) return;
    setCapturing(true);
    try {
      const [backFile, frontFile] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        backPhotoOutput.capturePhotoToFile({}, EMPTY_CALLBACKS),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        frontPhotoOutput.capturePhotoToFile({}, EMPTY_CALLBACKS),
      ]);
      onDone(
        (backFile as { filePath: string }).filePath,
        (frontFile as { filePath: string }).filePath
      );
    } catch (err) {
      fallback(err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Mount WITHOUT previewOutput prop — Fabric's createNode serializes props
          through folly::dynamic which cannot carry a Nitro HybridObject.
          previewOutput is set imperatively via hybridRef → JSI setPreviewOutput(). */}
      <NativePreviewView
        style={StyleSheet.absoluteFillObject}
        hybridRef={onBackRef}
      />

      {!ready && (
        <View style={[StyleSheet.absoluteFillObject, s.center]}>
          <ActivityIndicator color={C.primary} />
        </View>
      )}

      <View
        style={[s.pip, { top: insets.top + PIP_TOP, right: PIP_RIGHT }]}
        pointerEvents="none"
      >
        <NativePreviewView
          style={StyleSheet.absoluteFillObject}
          hybridRef={onFrontRef}
        />
      </View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={s.topBar}>
          <Pressable
            style={s.backBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.backBtnText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={s.copyBlock}>
          <Text style={s.copyTitle}>Ready to snap</Text>
          <Text style={s.copySubtitle}>
            Point at your cleanup area — one tap captures both cameras at once.
          </Text>
        </View>

        <View style={s.controls}>
          <Pressable
            style={[s.shutterOuter, (capturing || !ready) && s.disabled]}
            onPress={() => { void captureSimultaneous(); }}
            disabled={capturing || !ready}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <View style={s.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Option B: sequential capture (fallback for older / unsupported devices) ──

function SequentialCapture({
  onDone,
  onCancel,
}: {
  onDone: (progressUri: string, selfieUri: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  // Single photo output shared across both camera steps
  const photoOutput = usePhotoOutput();

  const capture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const file = await photoOutput.capturePhotoToFile({}, EMPTY_CALLBACKS);
      if (step === 'front') {
        setSelfieUri(file.filePath);
        setStep('back');
      } else if (selfieUri) {
        onDone(file.filePath, selfieUri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const activeDevice = step === 'front' ? frontDevice : backDevice;

  if (!activeDevice) return null;

  return (
    <View style={s.root}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={activeDevice}
        isActive
        outputs={[photoOutput]}
      />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={s.topBar}>
          {step === 'front' && (
            <AnimatedPressable
              style={s.backBtn}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={s.backBtnText}>Cancel</Text>
            </AnimatedPressable>
          )}
        </View>

        <CoachmarkEnter>
          <View style={s.copyBlock}>
            {step === 'front' ? (
              <>
                <Text style={s.copyTitle}>Take your selfie</Text>
                <Text style={s.copySubtitle}>Face the camera and tap the button.</Text>
              </>
            ) : (
              <>
                <Text style={s.copyTitle}>Capture your progress</Text>
                <Text style={s.copySubtitle}>
                  Point at the cleanup area and tap the button.
                </Text>
              </>
            )}
          </View>
        </CoachmarkEnter>

        <View style={s.controls}>
          <ShutterButton
            onPress={() => { void capture(); }}
            disabled={capturing}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export function PhotoCaptureScreen() {
  const router = useRouter();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [progressUri, setProgressUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[s.root, s.center]} edges={['top', 'bottom']}>
        <Text style={s.copyTitle}>Camera not available on web</Text>
        <AnimatedPressable
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={s.backBtnText}>Go Back</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  const normalizeUri = (path: string) =>
    Platform.OS === 'android' && !path.startsWith('file://')
      ? `file://${path}`
      : path.startsWith('file://')
        ? path
        : `file://${path}`;

  const handleDone = (progress: string, selfie: string) => {
    setProgressUri(normalizeUri(progress));
    setSelfieUri(normalizeUri(selfie));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !selfieUri || !progressUri) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const persisted = await persistCheckpointPhotos({
        selfieUri,
        progressUri,
        capturedAt: Date.now(),
      });
      addPhotoCheckpoint(persisted);
      router.replace('/photo-submitted');
    } catch {
      setSubmitError('Could not save photos. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelfieUri(null);
    setProgressUri(null);
    setSubmitError(null);
  };

  if (selfieUri && progressUri) {
    return (
      <BeRealPreview
        selfieUri={selfieUri}
        progressUri={progressUri}
        onSubmit={() => {
          void handleSubmit();
        }}
        onRetake={handleRetake}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  }

  // DualCapture (simultaneous front+back) is disabled — VisionCamera v5 HybridObject
  // props cannot survive Fabric's folly::dynamic serialization at createNode time.
  // Always use sequential capture until a viable workaround is found.
  return (
    <SequentialCapture
      onDone={handleDone}
      onCancel={() => router.dismissTo('/live-session')}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgApp },
  center: { alignItems: 'center', justifyContent: 'center' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 44,
  },

  backBtn: {
    backgroundColor: C.overlay,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  backBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textOnPrimary,
  },

  copyBlock: {
    alignSelf: 'center',
    maxWidth: 320,
    gap: 8,
    backgroundColor: C.overlay,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  copyTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  copySubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  controls: {
    alignItems: 'center',
    paddingBottom: 28,
  },

  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: C.textOnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.textOnPrimary,
  },

  disabled: { opacity: 0.5 },

  pip: {
    position: 'absolute',
    width: PIP_SIZE,
    height: PIP_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 10,
  },

  previewRoot: { flex: 1, backgroundColor: '#000' },

  previewActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  retakeBtn: {
    width: '100%',
    height: 59,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.textOnPrimary,
    backgroundColor: C.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  retakeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  submitBtn: {
    width: '100%',
    height: 59,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  errorText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#ffb4ab',
    textAlign: 'center',
    marginBottom: 8,
  },
});
