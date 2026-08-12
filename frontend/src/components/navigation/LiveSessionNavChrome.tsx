import React, { useCallback } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import {
  LiveSessionMinimizedPill,
  LIVE_SESSION_PILL_MIN_HEIGHT,
} from '@/features/session-tracking/components/LiveSessionMinimizedPill';
import { useLiveSessionBarExit } from '@/features/session-tracking/hooks/useLiveSessionBarExit';
import {
  getCheckpointProgress,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';

/** Pill height + vertical padding — add to scroll bottom padding when active. */
export const LIVE_SESSION_MINIMIZED_BAR_HEIGHT = LIVE_SESSION_PILL_MIN_HEIGHT + 16;

/**
 * Shared live-session chrome for any screen with the 5-tab bottom nav.
 * Shows the minimized pill whenever a session is active (not on `/live-session`).
 */
export function useLiveSessionNavChrome() {
  const router = useRouter();
  const { isActive } = useLiveSession();
  const navigateLiveSession = useCallback(() => router.push('/live-session' as Href), [router]);
  const { barStyle, expandLiveSession, resetBar } = useLiveSessionBarExit({
    onNavigate: navigateLiveSession,
  });

  useFocusEffect(
    useCallback(() => {
      resetBar();
    }, [resetBar]),
  );

  const onTrackPress = useCallback(() => {
    if (isActive) {
      expandLiveSession();
    } else {
      router.push('/session-setup-guide' as Href);
    }
  }, [expandLiveSession, isActive, router]);

  const barExtraHeight = isActive ? LIVE_SESSION_MINIMIZED_BAR_HEIGHT : 0;

  return {
    isActive,
    onTrackPress,
    expandLiveSession,
    barStyle,
    barExtraHeight,
  };
}

type MinimizedBarProps = {
  barStyle: ReturnType<typeof useLiveSessionBarExit>['barStyle'];
  onExpand: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Green minimized tracker pill stacked above the bottom nav. */
export function LiveSessionMinimizedBar({ barStyle, onExpand, style }: MinimizedBarProps) {
  const {
    elapsedSeconds,
    checkpointSecondsRemaining,
    distanceMiles,
    submittedCheckpoints,
  } = useLiveSession();
  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);

  return (
    <Animated.View style={[styles.liveBar, barStyle, style]}>
      <LiveSessionMinimizedPill
        distanceMiles={distanceMiles}
        elapsedSeconds={elapsedSeconds}
        checkpointSecondsRemaining={checkpointSecondsRemaining}
        checkpointProgress={checkpointProgress}
        submittedCheckpoints={submittedCheckpoints}
        onExpand={onExpand}
        showExpandButton
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  liveBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
