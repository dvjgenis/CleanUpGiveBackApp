import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  type CameraDevice,
  type PhotoFile,
} from 'react-native-vision-camera';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import { addPhotoCheckpoint } from '@/features/session-tracking/liveSessionStore';
import { persistCheckpointPhotos } from '@/features/session-tracking/utils/persistCheckpointPhotos';
import { colors as tokens } from '@/constants/tokens';
import {
  checkMultiCamSupport,
  type MultiCamCheckResult,
} from '@/utils/checkMultiCamSupport';

const C = {
  bgApp: tokens.bgApp,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

const PIP_SIZE = 170;
const PIP_LEFT = 17;
const PIP_TOP = 14;

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

      <View style={[s.pip, { top: insets.top + PIP_TOP }]} pointerEvents="none">
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

// ─── Option A: simultaneous dual-camera (iPhone XS / A12+ only) ──────────────

function DualCapture({
  front,
  back,
  onDone,
  onCancel,
}: {
  front: CameraDevice;
  back: CameraDevice;
  onDone: (progressUri: string, selfieUri: string) => void;
  onCancel: () => void;
}) {
  const backRef = useRef<Camera>(null);
  const frontRef = useRef<Camera>(null);
  const [capturing, setCapturing] = useState(false);
  const insets = useSafeAreaInsets();

  const captureSimultaneous = async () => {
    if (capturing || !backRef.current || !frontRef.current) return;
    setCapturing(true);
    try {
      const [backPhoto, frontPhoto] = await Promise.all<PhotoFile>([
        backRef.current.takePhoto({ flash: 'off' }),
        frontRef.current.takePhoto({ flash: 'off' }),
      ]);
      onDone(backPhoto.path, frontPhoto.path);
    } catch (err) {
      console.warn('[DualCapture] Simultaneous capture failed:', err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Back camera — full screen */}
      <Camera
        ref={backRef}
        style={StyleSheet.absoluteFillObject}
        device={back}
        isActive
        photo
      />

      {/* Front camera — PIP top-left */}
      <View style={[s.pip, { top: insets.top + PIP_TOP }]} pointerEvents="none">
        <Camera
          ref={frontRef}
          style={StyleSheet.absoluteFillObject}
          device={front}
          isActive
          photo
          outputOrientation="device"
        />
      </View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={s.topBar}>
          <AnimatedPressable
            style={s.backBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.backBtnText}>Cancel</Text>
          </AnimatedPressable>
        </View>

        <CoachmarkEnter>
          <View style={s.copyBlock}>
            <Text style={s.copyTitle}>Ready to snap</Text>
            <Text style={s.copySubtitle}>
              Point at your cleanup area — one tap captures both.
            </Text>
          </View>
        </CoachmarkEnter>

        <View style={s.controls}>
          <ShutterButton onPress={() => { void captureSimultaneous(); }} disabled={capturing} />
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
  const [step, setStep] = useState<'back' | 'front'>('back');
  const [progressUri, setProgressUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const backRef = useRef<Camera>(null);
  const frontRef = useRef<Camera>(null);

  const devices = Camera.getAvailableCameraDevices();
  const backDevice = devices.find((d) => d.position === 'back');
  const frontDevice = devices.find((d) => d.position === 'front');

  // After capturing the back photo, auto-trigger the front after a brief delay
  // so the camera has time to switch — no second tap needed.
  useEffect(() => {
    if (step !== 'front') return;
    const timer = setTimeout(() => { void captureFront(); }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const captureBack = async () => {
    if (capturing || !backRef.current) return;
    setCapturing(true);
    try {
      const photo = await backRef.current.takePhoto({ flash: 'off' });
      setProgressUri(photo.path);
      setStep('front');
    } finally {
      setCapturing(false);
    }
  };

  const captureFront = async () => {
    if (capturing || !frontRef.current || !progressUri) return;
    setCapturing(true);
    try {
      const photo = await frontRef.current.takePhoto({ flash: 'off' });
      onDone(progressUri, photo.path);
    } finally {
      setCapturing(false);
    }
  };

  const activeDevice = step === 'back' ? backDevice : frontDevice;
  const activeRef = step === 'back' ? backRef : frontRef;

  if (!activeDevice) return null;

  return (
    <View style={s.root}>
      <Camera
        ref={activeRef}
        style={StyleSheet.absoluteFillObject}
        device={activeDevice}
        isActive
        photo
      />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={s.topBar}>
          {step === 'back' && (
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
            {step === 'back' ? (
              <>
                <Text style={s.copyTitle}>Capture your progress</Text>
                <Text style={s.copySubtitle}>
                  Point at the cleanup area — selfie is taken automatically after.
                </Text>
              </>
            ) : (
              <>
                <Text style={s.copyTitle}>Capturing selfie…</Text>
                <Text style={s.copySubtitle}>Hold still</Text>
              </>
            )}
          </View>
        </CoachmarkEnter>

        <View style={s.controls}>
          {step === 'back' && (
            <ShutterButton onPress={() => { void captureBack(); }} disabled={capturing} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export function PhotoCaptureScreen() {
  const router = useRouter();
  const [multiCamResult, setMultiCamResult] =
    useState<MultiCamCheckResult | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [progressUri, setProgressUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  useEffect(() => {
    void checkMultiCamSupport().then(setMultiCamResult);
  }, []);

  if (!fontsLoaded || !multiCamResult) {
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
      : path;

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
        onSubmit={() => { void handleSubmit(); }}
        onRetake={handleRetake}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  }

  // Option A: true simultaneous dual-camera (A12+ devices)
  if (multiCamResult.supported) {
    return (
      <DualCapture
        front={multiCamResult.front}
        back={multiCamResult.back}
        onDone={handleDone}
        onCancel={() => router.dismissTo('/live-session')}
      />
    );
  }

  // Option B: sequential fallback — one tap, selfie auto-fires after camera switch
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
    left: PIP_LEFT,
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
