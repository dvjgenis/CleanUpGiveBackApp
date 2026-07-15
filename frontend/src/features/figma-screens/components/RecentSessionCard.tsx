import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import type { RecentSessionSummary } from '../mocks/home.types';
import { colors, fontFamilies, radius } from '../tokens';
import { DateIcon, TimeIcon } from './HomeIcons';

type Props = {
  session: RecentSessionSummary;
  onPress?: () => void;
};

/** Figma `406:409` — Recent Sessions card (`City Park Trail Clean-up`). */
export function RecentSessionCard({ session, onPress }: Props) {
  const content = (
    <View style={s.sessionContainer}>
      <View style={s.titleContainer}>
        <Text style={s.title} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={s.detailsRow}>
          <View style={s.chip}>
            <DateIcon color={colors.textNavInactive} />
            <Text style={s.chipText}>{session.dateLabel}</Text>
          </View>
          <View style={s.chip}>
            <TimeIcon color={colors.textNavInactive} />
            <Text style={s.chipText}>{session.timeLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={s.duration}>{session.durationLabel}</Text>
    </View>
  );

  if (!onPress) {
    return <View style={s.card}>{content}</View>;
  }

  return (
    <AnimatedPressable
      style={s.card}
      scaleTo={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.title}, ${session.dateLabel}, ${session.durationLabel}`}
    >
      {content}
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    overflow: 'hidden',
  },
  sessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleContainer: {
    flex: 1,
    gap: 15,
    marginRight: 8,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    backgroundColor: colors.borderOutline,
    borderRadius: radius.sm,
    padding: 5,
  },
  chipText: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    flexShrink: 0,
  },
  duration: {
    flexShrink: 0,
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    color: colors.primary,
  },
});
