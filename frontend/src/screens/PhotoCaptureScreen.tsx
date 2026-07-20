import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
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
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

const PIP_SIZE = 170;
const PIP_RIGHT = 17;
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

// ─── Sequential capture (front → back) using expo-camera ─────────────────────

function SequentialCapture({
  onDone,
  onCancel,
}: {
  onDone: (progressUri: string, selfieUri: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    setCameraReady(false);
    setCaptureError(null);
  }, [step]);

  if (!permission) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.copyTitle}>Camera permission needed</Text>
        <Text style={[s.copySubtitle, { marginTop: 8, color: C.textTertiary }]}>
          Allow camera access to submit checkpoint photos.
        </Text>
        <AnimatedPressable
          style={[s.submitBtn, { marginTop: 24, width: 220 }]}
          onPress={() => { void requestPermission(); }}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={s.submitBtnText}>Allow Camera</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[s.backBtn, { marginTop: 12 }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={s.backBtnText}>Cancel</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const capture = async () => {
    if (capturing || !cameraReady || !cameraRef.current) return;
    setCapturing(true);
    setCaptureError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) throw new Error('Capture returned no URI');

      if (step === 'front') {
        setSelfieUri(photo.uri);
        setStep('back');
      } else if (selfieUri) {
        onDone(photo.uri, selfieUri);
      }
    } catch (error) {
      console.warn('[SequentialCapture] capture failed:', error);
      const message = 'Could not capture photo. Please try again.';
      setCaptureError(message);
      Alert.alert('Capture failed', message);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={s.root}>
      <CameraView
        key={step}
        ref={cameraRef as unknown as React.Ref<CameraView>}
        style={StyleSheet.absoluteFillObject}
        facing={step}
        onCameraReady={() => setCameraReady(true)}
      />

      {!cameraReady && (
        <View style={[StyleSheet.absoluteFillObject, s.center]} pointerEvents="none">
          <ActivityIndicator color={C.primary} />
        </View>
      )}

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
            {captureError ? <Text style={s.captureError}>{captureError}</Text> : null}
          </View>
        </CoachmarkEnter>

        <View style={s.controls}>
          <ShutterButton
            onPress={() => { void capture(); }}
            disabled={capturing || !cameraReady}
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

  const normalizeUri = (uri: string) =>
    Platform.OS === 'android' && !uri.startsWith('file://')
      ? `file://${uri}`
      : uri;

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

  captureError: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFB4AB',
    textAlign: 'center',
    marginTop: 4,
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
