import { StyleSheet, Text, View } from 'react-native';

import type { RecentSessionSummary } from '../mocks/home.types';
import { colors, fontFamilies, radius } from '../tokens';
import { DateIcon, TimeIcon } from './HomeIcons';

type Props = {
  session: RecentSessionSummary;
};

/** Figma `406:409` — Recent Sessions card (`City Park Trail Clean-up`). */
export function RecentSessionCard({ session }: Props) {
  return (
    <View style={s.card}>
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
    </View>
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
    maxWidth: 204,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.borderOutline,
    borderRadius: radius.sm,
    padding: 5,
  },
  chipText: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  duration: {
    flexShrink: 0,
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 18,
    color: colors.primary,
  },
});
