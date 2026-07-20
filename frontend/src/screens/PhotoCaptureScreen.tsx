import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { CameraView, type FlashMode, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

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
  footer: 'rgba(0, 0, 0, 0.82)',
  zoomAccent: '#F5C518',
} as const;

const PIP_SIZE = 170;
const PIP_RIGHT = 17;
const PIP_TOP = 14;

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];

/** Display zoom range mapped onto expo-camera's 0–1 `zoom` prop. */
const ZOOM_MIN_FACTOR = 1;
const ZOOM_MAX_FACTOR = 5;
const ZOOM_MAJOR_STOPS = [1, 2, 3, 5] as const;
const ZOOM_TICK_STEP = 0.1;
const ZOOM_WHEEL_HEIGHT = 96;
const ZOOM_PAN_SENSITIVITY = 0.0042;
const ZOOM_ARC_SPAN_DEG = 56;

const SCREEN_WIDTH = Dimensions.get('window').width;

function nextFlashMode(current: FlashMode): FlashMode {
  const index = FLASH_CYCLE.indexOf(current);
  return FLASH_CYCLE[(index + 1) % FLASH_CYCLE.length] ?? 'off';
}

function flashLabel(mode: FlashMode): string {
  switch (mode) {
    case 'off':
      return 'Flash off';
    case 'on':
      return 'Flash on';
    case 'auto':
      return 'Flash auto';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function zoomToFactor(zoom: number): number {
  return ZOOM_MIN_FACTOR + zoom * (ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR);
}

function formatZoomFactor(factor: number): string {
  if (Math.abs(factor - Math.round(factor)) < 0.05) {
    return `${Math.round(factor)}×`;
  }
  return `${factor.toFixed(1)}×`;
}

function FlashIcon({ mode }: { mode: FlashMode }) {
  const stroke = C.textOnPrimary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"
        fill={mode === 'off' ? 'none' : stroke}
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      {mode === 'off' ? (
        <Path
          d="M4 4l16 16"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
      ) : null}
      {mode === 'auto' ? (
        <Path
          d="M17.5 4.5h3M19 3v3"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

function FlashToggle({
  mode,
  onPress,
}: {
  mode: FlashMode;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={s.flashBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={flashLabel(mode)}
      accessibilityHint="Cycles flash off, on, and auto"
    >
      <FlashIcon mode={mode} />
      <Text style={s.flashBtnText}>
        {mode === 'off' ? 'Off' : mode === 'on' ? 'On' : 'Auto'}
      </Text>
    </AnimatedPressable>
  );
}

type ZoomTick = {
  factor: number;
  major: boolean;
  label?: string;
};

function buildZoomTicks(): ZoomTick[] {
  const ticks: ZoomTick[] = [];
  const steps = Math.round((ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR) / ZOOM_TICK_STEP);
  for (let i = 0; i <= steps; i += 1) {
    const factor = Number((ZOOM_MIN_FACTOR + i * ZOOM_TICK_STEP).toFixed(1));
    const major = (ZOOM_MAJOR_STOPS as readonly number[]).includes(factor);
    ticks.push({
      factor,
      major,
      label: major ? String(factor) : undefined,
    });
  }
  return ticks;
}

/**
 * Apple-style curved zoom dial. Horizontal pan rotates the arc so the
 * selected factor sits under a fixed yellow caret; maps to CameraView zoom 0–1.
 */
function ZoomWheel({
  value,
  onChange,
}: {
  value: number;
  onChange: (zoom: number) => void;
}) {
  const zoomSV = useSharedValue(value);
  const startZoom = useSharedValue(value);
  const [label, setLabel] = useState(formatZoomFactor(zoomToFactor(value)));
  const ticks = useMemo(() => buildZoomTicks(), []);

  const wheelWidth = SCREEN_WIDTH;
  const radius = wheelWidth * 1.05;
  const cx = wheelWidth / 2;
  const cy = radius + 10;
  const degPerFactor = ZOOM_ARC_SPAN_DEG / (ZOOM_MAX_FACTOR - ZOOM_MIN_FACTOR);

  useEffect(() => {
    zoomSV.value = value;
    setLabel(formatZoomFactor(zoomToFactor(value)));
  }, [value, zoomSV]);

  const commitZoom = useCallback(
    (next: number) => {
      const clamped = Math.min(1, Math.max(0, next));
      onChange(clamped);
      setLabel(formatZoomFactor(zoomToFactor(clamped)));
    },
    [onChange],
  );

  useAnimatedReaction(
    () => zoomSV.value,
    (current, previous) => {
      if (previous !== null && Math.abs(current - previous) < 0.002) return;
      runOnJS(setLabel)(formatZoomFactor(zoomToFactor(current)));
    },
  );

  const pan = Gesture.Pan()
    .onBegin(() => {
      startZoom.value = zoomSV.value;
    })
    .onChange((event) => {
      // Drag left → zoom in (higher factors move under the caret).
      const next = Math.min(
        1,
        Math.max(0, startZoom.value - event.translationX * ZOOM_PAN_SENSITIVITY),
      );
      zoomSV.value = next;
      runOnJS(commitZoom)(next);
    });

  const dialStyle = useAnimatedStyle(() => {
    const factor = zoomToFactor(zoomSV.value);
    const rotation = -(factor - ZOOM_MIN_FACTOR) * degPerFactor;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <GestureHandlerRootView
      style={s.zoomWheelRoot}
      accessibilityLabel={`Zoom ${label}`}
      accessibilityHint="Swipe left or right to adjust zoom"
    >
      <View style={s.zoomCaretRow} pointerEvents="none">
        <View style={s.zoomCaret} />
        <Text style={s.zoomValue}>{label}</Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={s.zoomDialHit}>
          <Animated.View
            style={[
              s.zoomDialSpin,
              {
                width: wheelWidth,
                height: ZOOM_WHEEL_HEIGHT,
                transformOrigin: `${cx}px ${cy}px`,
              },
              dialStyle,
            ]}
          >
            <Svg width={wheelWidth} height={ZOOM_WHEEL_HEIGHT}>
              <Circle
                cx={cx}
                cy={cy}
                r={radius - 46}
                fill="rgba(18,18,18,0.5)"
              />
              {ticks.map((tick) => {
                const angleDeg = -90 + (tick.factor - ZOOM_MIN_FACTOR) * degPerFactor;
                const rad = (angleDeg * Math.PI) / 180;
                const outer = radius;
                const inner = tick.major ? radius - 18 : radius - 10;
                const x1 = cx + outer * Math.cos(rad);
                const y1 = cy + outer * Math.sin(rad);
                const x2 = cx + inner * Math.cos(rad);
                const y2 = cy + inner * Math.sin(rad);
                const labelR = radius - 34;
                const lx = cx + labelR * Math.cos(rad);
                const ly = cy + labelR * Math.sin(rad);

                return (
                  <G key={`tick-${tick.factor}`}>
                    <Line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.88)"
                      strokeWidth={tick.major ? 2 : 1}
                      strokeLinecap="round"
                    />
                    {tick.label ? (
                      <SvgText
                        x={lx}
                        y={ly + 4}
                        fill="rgba(255,255,255,0.95)"
                        fontSize={13}
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {tick.label}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

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
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    setCameraReady(false);
    setCaptureError(null);
    setZoom(0);
    // Flash is back-camera only; reset so a retake doesn't keep a surprise flash.
    if (step === 'front') setFlashMode('off');
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
        flash={step === 'back' ? flashMode : 'off'}
        zoom={zoom}
        onCameraReady={() => setCameraReady(true)}
      />

      {!cameraReady && (
        <View style={[StyleSheet.absoluteFillObject, s.center]} pointerEvents="none">
          <ActivityIndicator color={C.primary} />
        </View>
      )}

      <SafeAreaView style={s.overlay} edges={['top']} pointerEvents="box-none">
        <View style={s.topBar}>
          {step === 'front' ? (
            <AnimatedPressable
              style={s.backBtn}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={s.backBtnText}>Cancel</Text>
            </AnimatedPressable>
          ) : (
            <View style={s.topBarSpacer} />
          )}
          {step === 'back' ? (
            <FlashToggle
              mode={flashMode}
              onPress={() => setFlashMode((prev) => nextFlashMode(prev))}
            />
          ) : null}
        </View>

        <View style={s.copyArea} pointerEvents="box-none">
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
        </View>
      </SafeAreaView>

      <View style={[s.bottomCluster, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <ZoomWheel value={zoom} onChange={setZoom} />
        <View style={s.footer}>
          <ShutterButton
            onPress={() => { void capture(); }}
            disabled={capturing || !cameraReady}
          />
        </View>
      </View>
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
    justifyContent: 'flex-start',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 44,
  },

  topBarSpacer: {
    width: 1,
    height: 1,
  },

  flashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.overlay,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  flashBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: C.textOnPrimary,
  },

  copyArea: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 16,
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

  bottomCluster: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  zoomWheelRoot: {
    alignItems: 'center',
    marginBottom: -6,
  },

  zoomCaretRow: {
    alignItems: 'center',
    zIndex: 2,
    marginBottom: -4,
  },

  zoomCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.zoomAccent,
  },

  zoomValue: {
    marginTop: 2,
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.zoomAccent,
    letterSpacing: 0.2,
  },

  zoomDialHit: {
    width: '100%',
    height: ZOOM_WHEEL_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  zoomDialSpin: {
    alignItems: 'center',
  },

  footer: {
    backgroundColor: C.footer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    minHeight: 118,
  },

  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: C.textOnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
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
