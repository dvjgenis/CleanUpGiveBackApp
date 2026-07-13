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
      {/* Yellow top bar — always visible */}
      <View style={styles.liveBar}>
        <Text style={styles.liveText}>Live</Text>
        {showExpandButton && onExpand && (
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
            <ExpandIcon color={colors.textPrimary} />
          </AnimatedPressable>
        )}
      </View>

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
    paddingBottom: 12,
    minHeight: PILL_MIN_HEIGHT,
    justifyContent: 'space-between',
    gap: 8,
    overflow: 'hidden',
  },
  liveBar: {
    backgroundColor: colors.statusPendingBorder,
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 9,
    minHeight: 36,
  },
  liveText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  expandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    color: colors.textOnPrimary,
  },
  statUnit: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.textOnPrimary,
    textAlign: 'center',
    opacity: 0.75,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderOutline,
    borderRadius: R.full,
    overflow: 'hidden',
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
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
