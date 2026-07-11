import { forwardRef } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimatedProgressFill } from '@/components/motion/hooks';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { ExpandIcon } from '@/features/figma-screens/components/HomeIcons';
import { colors, fontFamilies, radius as R } from '@/features/figma-screens/tokens';
import {
  formatCountdown,
  formatElapsed,
} from '@/features/session-tracking/mocks/session';
import type { PhotoCheckpointSubmission } from '@/features/session-tracking/liveSessionStore';
import { formatSubmittedCheckpointCount, shouldShowCheckpointSubmissionCount } from '@/features/session-tracking/utils/sessionFormat';

const PILL_MIN_HEIGHT = 112;

function formatDistanceMiles(miles: number): string {
  if (miles === 0) {
    return '0';
  }
  return miles.toFixed(1);
}

type Props = ViewProps & {
  distanceMiles: number;
  elapsedSeconds: number;
  checkpointSecondsRemaining: number;
  checkpointProgress: number;
  submittedCheckpoints: PhotoCheckpointSubmission[];
  onExpand?: () => void;
  showExpandButton?: boolean;
};

/** Green minimized tracker pill — Figma node `622:176` on the home dashboard. */
export const LiveSessionMinimizedPill = forwardRef<View, Props>(function LiveSessionMinimizedPill(
  {
    distanceMiles,
    elapsedSeconds,
    checkpointSecondsRemaining,
    checkpointProgress,
    submittedCheckpoints,
    onExpand,
    showExpandButton = false,
    style,
    ...rest
  },
  ref,
) {
  const submittedCheckpointCount = submittedCheckpoints.length;
  const showSubmissionCount = shouldShowCheckpointSubmissionCount(submittedCheckpoints);
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(submittedCheckpointCount);
  const progressFillStyle = useAnimatedProgressFill(checkpointProgress);

  return (
    <View ref={ref} style={[styles.pill, style]} {...rest}>
      {showExpandButton && onExpand && (
        <View style={styles.topRow}>
          <AnimatedPressable
            onPress={onExpand}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              showSubmissionCount
                ? `Expand live session tracker. ${submittedCheckpointLabel}.`
                : 'Expand live session tracker'
            }
            style={styles.expandBtn}
          >
            <ExpandIcon />
          </AnimatedPressable>
        </View>
      )}

      <View style={styles.statRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{formatDistanceMiles(distanceMiles)}</Text>
          <Text style={styles.statUnit}>mi</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
          <Text style={styles.statUnit}>time</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.timeLeftValue}>{formatCountdown(checkpointSecondsRemaining)}</Text>
          <Text style={styles.statUnit}>time left</Text>
        </View>
      </View>

      {showSubmissionCount && (
        <View style={styles.checkpointRow}>
          <View style={styles.checkpointDots}>
            {submittedCheckpoints.map((checkpoint) => (
              <View key={checkpoint.id} style={styles.checkpointDot} />
            ))}
          </View>
          <Text style={styles.checkpointLabel}>{submittedCheckpointLabel}</Text>
        </View>
      )}

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressFillStyle]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.primary,
    borderRadius: R.md,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: PILL_MIN_HEIGHT,
    justifyContent: 'space-between',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 22,
  },
  expandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 24,
    color: colors.textOnPrimary,
  },
  timeLeftValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 24,
    color: colors.statusPendingBorder,
  },
  statUnit: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.borderOutline,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderOutline,
    borderRadius: R.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.statusPendingBorder,
    borderRadius: R.full,
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkpointDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkpointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textOnPrimary,
  },
  checkpointLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
    color: colors.textOnPrimary,
  },
});

export { PILL_MIN_HEIGHT as LIVE_SESSION_PILL_MIN_HEIGHT };
