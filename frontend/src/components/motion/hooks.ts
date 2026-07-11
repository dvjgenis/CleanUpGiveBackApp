import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { durations, easing, enterFrom, modalSpring } from '@/motion';

/** Animates a 0–1 progress fraction into track fill width (enter + live updates). */
export function useAnimatedProgressFill(fraction: number, enterDuration = 300) {
  const reducedMotion = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, fraction));
  const animated = useSharedValue(reducedMotion ? clamped : 0);
  const hasEntered = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      animated.value = clamped;
      return;
    }

    const duration = hasEntered.current ? durations.screenEnter : enterDuration;
    hasEntered.current = true;
    animated.value = withTiming(clamped, { duration, easing: easing.easeOut });
  }, [animated, clamped, enterDuration, reducedMotion]);

  return useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));
}

/** Fade-up screen enter — opacity + translateY only. Skipped when reduced motion is on. */
export function useFadeUpEnter(delayMs = 0) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durations.screenEnter, easing: easing.easeOut }),
    );
  }, [delayMs, progress, reducedMotion]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * enterFrom.translateY }],
  }));
}

/** Centered modal card enter — scrim fade + card slide-up spring (`photo-checkpoint`). */
export function useModalCardEnter() {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(reducedMotion ? 0 : 32);
  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const scrimOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    translateY.value = withSpring(0, modalSpring);
    cardOpacity.value = withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
    scrimOpacity.value = withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
  }, [cardOpacity, reducedMotion, scrimOpacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  return { cardStyle, scrimStyle };
}

/** Short horizontal shake for warning / error attention states. */
export function useAttentionShake() {
  const reducedMotion = useReducedMotion();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    shakeX.value = withSequence(
      withTiming(-6, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(6, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(-3, { duration: durations.warningAttention / 4, easing: easing.easeInOut }),
      withTiming(0, { duration: durations.warningAttention / 4, easing: easing.easeOut }),
    );
  }, [reducedMotion, shakeX]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
}

const COACHMARK_SCALE_FROM = 0.95;

/** Coachmark step enter — fade + scale (0.95→1), 200ms (`coachmark-tutorial`). */
export function useCoachmarkEnter(delayMs = 0) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durations.coachmark, easing: easing.easeOut }),
    );
  }, [delayMs, progress, reducedMotion]);

  return useAnimatedStyle(() => {
    const scale = COACHMARK_SCALE_FROM + progress.value * (1 - COACHMARK_SCALE_FROM);
    return {
      opacity: progress.value,
      transform: [{ scale }],
    };
  });
}
