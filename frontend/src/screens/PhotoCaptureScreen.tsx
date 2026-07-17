import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import { addPhotoCheckpoint } from '@/features/session-tracking/liveSessionStore';
import { persistCheckpointPhotos } from '@/features/session-tracking/utils/persistCheckpointPhotos';

import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

const SELFIE_COUNTDOWN_SECONDS = 3;

/** back → front → preview */
type CaptureStep = 'back' | 'front' | 'preview';

function ShutterButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <AnimatedPressable
      style={[s.shutterOuter, disabled && s.shutterDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Take photo"
    >
      <View style={s.shutterInner} />
    </AnimatedPressable>
  );
}

function BeRealStylePreview({
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
      <View style={s.previewBackgroundWrap} pointerEvents="none">
        <Image
          source={{ uri: progressUri }}
          style={s.previewBackground}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Cleanup progress photo"
        />
      </View>

      <View
        style={[s.previewPipWrap, { top: insets.top + PIP_TOP_OFFSET }]}
        pointerEvents="none"
      >
        <Image
          source={{ uri: selfieUri }}
          style={s.previewPip}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Selfie photo"
        />
      </View>

      <SafeAreaView style={s.previewSubmitWrap} edges={['bottom']} pointerEvents="box-none">
        <Animated.View style={[s.previewActions, actionsStyle]} pointerEvents="auto">
          {submitError ? (
            <Text style={s.submitErrorText} accessibilityRole="alert">
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
            style={[s.submitBtn, isSubmitting && s.shutterDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Submit photos"
          >
            <Text style={s.submitBtnText}>{isSubmitting ? 'Saving…' : 'Submit'}</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Sequential dual-shot flow using a single CameraView:
 *   1. Back camera — user frames cleanup area and taps shutter.
 *   2. Front camera — auto-captures after a countdown so the user can prepare their selfie.
 *   3. BeReal-style preview — progress photo full-screen, selfie PIP top-left.
 *
 * Running two simultaneous CameraView instances is unsupported on mobile hardware
 * (only one physical camera can stream at a time), so shots are taken sequentially
 * and the facing prop is swapped between steps.
 */
export function PhotoCaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captureStep, setCaptureStep] = useState<CaptureStep>('back');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [progressUri, setProgressUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(SELFIE_COUNTDOWN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  // Auto-capture selfie after countdown when front camera step begins.
  useEffect(() => {
    if (captureStep !== 'front') return;

    setCountdown(SELFIE_COUNTDOWN_SECONDS);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          void captureSelfie();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // captureSelfie is stable (uses ref + setState only); exhaustive-deps would force a re-render loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureStep]);

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  if (!permission) {
    return <View style={s.root} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permissionRoot} edges={['top', 'bottom']}>
        <CoachmarkEnter style={s.permissionCard}>
          <Text style={s.permissionTitle}>Camera access needed</Text>
          <Text style={s.permissionBody}>
            Photo checkpoints require camera access to capture your selfie and cleanup progress.
          </Text>
          <AnimatedPressable
            style={s.primaryBtn}
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Enable camera"
          >
            <Text style={s.primaryBtnText}>Enable Camera</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.secondaryBtn}
            onPress={() => router.dismissTo('/live-session')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={s.secondaryBtnText}>Go Back</Text>
          </AnimatedPressable>
        </CoachmarkEnter>
      </SafeAreaView>
    );
  }

  const captureProgress = async () => {
    if (isCapturing || captureStep !== 'back' || Platform.OS === 'web') return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
      });
      if (!photo?.uri) return;
      setProgressUri(photo.uri);
      setCaptureStep('front');
    } finally {
      setIsCapturing(false);
    }
  };

  const captureSelfie = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
        mirror: true,
      });
      if (!photo?.uri) return;
      setSelfieUri(photo.uri);
      setCaptureStep('preview');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !selfieUri || !progressUri) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const capturedAt = Date.now();
      const persisted = await persistCheckpointPhotos({
        selfieUri,
        progressUri,
        capturedAt,
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
    setCaptureStep('back');
  };

  if (captureStep === 'preview' && selfieUri && progressUri) {
    return (
      <BeRealStylePreview
        selfieUri={selfieUri}
        progressUri={progressUri}
        onSubmit={() => { void handleSubmit(); }}
        onRetake={handleRetake}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={s.permissionRoot} edges={['top', 'bottom']}>
        <View style={s.permissionCard}>
          <Text style={s.permissionTitle}>Camera not available on web</Text>
          <Text style={s.permissionBody}>
            Use the iOS or Android dev build to capture checkpoint photos.
          </Text>
          <AnimatedPressable
            style={s.secondaryBtn}
            onPress={() => router.dismissTo('/live-session')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={s.secondaryBtnText}>Go Back</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  const isFrontStep = captureStep === 'front';

  return (
    <View style={s.root}>
      <CameraView
        ref={cameraRef}
        style={s.camera}
        facing={isFrontStep ? 'front' : 'back'}
        mirror={isFrontStep}
      />

      <SafeAreaView style={s.cameraOverlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={s.topBar}>
          <AnimatedPressable
            style={s.backBtn}
            onPress={() => router.dismissTo('/live-session')}
            accessibilityRole="button"
            accessibilityLabel="Cancel photo capture"
          >
            <Text style={s.backBtnText}>Cancel</Text>
          </AnimatedPressable>
        </View>

        <CoachmarkEnter>
          <View style={s.captureCopy}>
            {isFrontStep ? (
              <>
                <Text style={s.captureTitle}>Now your selfie</Text>
                <Text style={s.captureSubtitle}>
                  Auto-capturing in {countdown}…
                </Text>
              </>
            ) : (
              <>
                <Text style={s.captureTitle}>Capture your progress</Text>
                <Text style={s.captureSubtitle}>
                  Point at the cleanup area. Your selfie is captured next.
                </Text>
              </>
            )}
          </View>
        </CoachmarkEnter>

        <View style={s.captureControls}>
          {isFrontStep ? (
            <ShutterButton onPress={() => { void captureSelfie(); }} disabled={isCapturing} />
          ) : (
            <ShutterButton onPress={() => { void captureProgress(); }} disabled={isCapturing} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const PIP_SIZE = 170;
const PIP_LEFT_OFFSET = 17;
const PIP_TOP_OFFSET = 14;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  permissionRoot: {
    flex: 1,
    backgroundColor: C.bgApp,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  permissionCard: {
    gap: 16,
    alignItems: 'center',
  },

  permissionTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
  },

  permissionBody: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: C.textTertiary,
    textAlign: 'center',
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
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

  captureCopy: {
    alignSelf: 'center',
    maxWidth: 320,
    gap: 8,
    backgroundColor: C.overlay,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  captureTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  captureSubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textOnPrimary,
    textAlign: 'center',
  },

  captureControls: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.textOnPrimary,
  },

  shutterDisabled: {
    opacity: 0.5,
  },

  previewRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },

  previewBackground: {
    width: '100%',
    height: '100%',
  },

  previewBackgroundWrap: {
    ...StyleSheet.absoluteFillObject,
  },

  previewPipWrap: {
    position: 'absolute',
    left: PIP_LEFT_OFFSET,
    width: PIP_SIZE,
    height: PIP_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.textTertiary,
    overflow: 'hidden',
  },

  previewPip: {
    width: '100%',
    height: '100%',
  },

  previewSubmitWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 2,
  },

  previewActions: {
    gap: 12,
  },

  submitErrorText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#ffb4ab',
    textAlign: 'center',
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
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  retakeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  submitBtn: {
    width: '100%',
    height: 59,
    backgroundColor: C.textTertiary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  submitBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  primaryBtn: {
    width: '100%',
    height: 59,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  primaryBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  secondaryBtn: {
    paddingVertical: 12,
  },

  secondaryBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textTertiary,
  },
});
