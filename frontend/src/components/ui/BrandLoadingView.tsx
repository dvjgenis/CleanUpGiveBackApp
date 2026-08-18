import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { BroomSweepLoader } from '@/components/ui/BroomSweepLoader';
import { colors, fontFamilies, textStyles } from '@/constants/tokens';

/** Keep loader up long enough for at least one broom pass (~3.5s). */
export const BRAND_LOADING_MIN_MS = 3500;

/** Wait out the remaining minimum overlay time after async work finishes. */
export async function waitForBrandLoadingMinimum(
  startedAtMs: number,
  minMs = BRAND_LOADING_MIN_MS,
): Promise<void> {
  const remaining = minMs - (Date.now() - startedAtMs);
  if (remaining <= 0) {
    return;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, remaining);
  });
}

type Props = {
  /** True while the screen fetch is in progress. */
  visible: boolean;
  message?: string;
  minDurationMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Delays hiding until `minMs` has elapsed since loading began. */
export function useBrandLoadingGate(loading: boolean, minMs = BRAND_LOADING_MIN_MS) {
  const [shown, setShown] = useState(loading);
  const shownAtRef = useRef<number | null>(loading ? Date.now() : null);

  useEffect(() => {
    if (loading) {
      shownAtRef.current = Date.now();
      setShown(true);
      return;
    }

    if (shownAtRef.current === null) {
      setShown(false);
      return;
    }

    const remaining = minMs - (Date.now() - shownAtRef.current);
    if (remaining <= 0) {
      setShown(false);
      shownAtRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      setShown(false);
      shownAtRef.current = null;
    }, remaining);
    return () => clearTimeout(timer);
  }, [loading, minMs]);

  return shown;
}

/** Full-screen broom-sweep overlay for session finalize only (`Saving session…`). */
export function BrandLoadingView({
  visible,
  message,
  minDurationMs = BRAND_LOADING_MIN_MS,
  style,
}: Props) {
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const show = useBrandLoadingGate(visible, minDurationMs);

  if (!show) {
    return null;
  }

  return (
    <View
      style={[s.fullScreen, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading, please wait'}
      pointerEvents="auto"
    >
      {!reducedMotion ? (
        <BroomSweepLoader width={width} height={height} />
      ) : (
        <View style={[s.reducedMotionFill, { width, height }]} />
      )}
      {message ? <Text style={s.fullScreenLabel}>{message}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: colors.bgApp,
  },
  reducedMotionFill: {
    backgroundColor: colors.bgApp,
  },
  fullScreenLabel: {
    ...textStyles.headlinePage,
    position: 'absolute',
    top: '58%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textOnPrimarySoft,
    fontFamily: fontFamilies.sanchezRegular,
  },
});
