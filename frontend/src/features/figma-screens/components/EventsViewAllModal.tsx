import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { durations, easing, modalSpring, sheetDismissSpring } from '@/motion';

import type { UpcomingEventSummary } from '../mocks/home.types';
import { formatEventMonthLabel } from '../utils/eventFormat';
import { colors, fontFamilies, radius as R } from '../tokens';
import {
  CloseIcon,
  EventCalendarDayBadge,
  EventLocationIcon,
  EventOrganizationIcon,
  TimeIcon,
} from './HomeIcons';

/** Travel distance for slide — sheet height plus bleed so the panel starts fully off-screen. */
const SHEET_BOTTOM_BLEED = 48;

type Props = {
  visible: boolean;
  events: UpcomingEventSummary[];
  onClose: () => void;
  onSelectEvent?: (eventId: string) => void;
};

function EventCalendarBadge({
  day,
  month,
  weekday,
  year,
}: {
  day: string;
  month: string;
  weekday: string;
  year: string;
}) {
  return (
    <View style={s.calBadgeRow}>
      <EventCalendarDayBadge day={day} />
      <View style={s.calMonthCol}>
        <Text style={s.calMonth}>{formatEventMonthLabel(month)}</Text>
        <Text style={s.calWeekday}>{weekday}</Text>
        <Text style={s.calYear}>{year}</Text>
      </View>
    </View>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: UpcomingEventSummary;
  onPress?: () => void;
}) {
  const content = (
    <>
      <EventCalendarBadge
        day={event.day}
        month={event.month}
        weekday={event.weekday}
        year={event.year}
      />
      <View style={s.eventDetails}>
        <View style={s.eventDetailRow}>
          <EventLocationIcon />
          <Text style={s.eventDetailText} numberOfLines={2}>
            {event.location}
          </Text>
        </View>
        <View style={s.eventDetailRow}>
          <TimeIcon />
          <Text style={s.eventDetailText}>{event.timeLabel}</Text>
        </View>
        <View style={s.eventDetailRow}>
          <EventOrganizationIcon />
          <Text style={s.eventDetailText}>{event.organization}</Text>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={s.eventCard}>{content}</View>;
  }

  return (
    <AnimatedPressable
      scaleTo={0.98}
      style={s.eventCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Event on ${event.month} ${event.day} at ${event.location}`}
    >
      {content}
    </AnimatedPressable>
  );
}

export function EventsViewAllModal({ visible, events, onClose, onSelectEvent }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetMaxHeight = windowHeight * 0.82;
  const scrollMaxHeight = sheetMaxHeight - 61;
  const reducedMotion = useReducedMotion();
  const dismissTravel = sheetMaxHeight + insets.bottom + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withSpring(dismissTravel, sheetDismissSpring, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [backdropOpacity, dismissTravel, onClose, reducedMotion, translateY]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { ...modalSpring, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
  }, [backdropOpacity, dismissTravel, reducedMotion, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={s.backdrop}>
        <Animated.View style={[s.scrim, backdropStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismiss}
          accessibilityLabel="Close events list"
        />

        <Animated.View style={[s.sheetWrap, sheetStyle]}>
          <View style={[s.sheet, { maxHeight: sheetMaxHeight }]}>
            <View style={s.header}>
              <Text style={s.title}>All Events</Text>
              <AnimatedPressable
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={dismiss}
                hitSlop={8}
                style={s.closeBtn}
              >
                <CloseIcon size={20} color={colors.textPrimary} />
              </AnimatedPressable>
            </View>

            <ScrollView
              style={[s.scroll, { maxHeight: scrollMaxHeight }]}
              contentContainerStyle={[s.scrollContent, { paddingBottom: 24 + insets.bottom }]}
              showsVerticalScrollIndicator
              bounces
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={onSelectEvent ? () => onSelectEvent(event.id) : undefined}
                />
              ))}
            </ScrollView>
          </View>
          <View style={[s.sheetBleed, { height: insets.bottom + SHEET_BOTTOM_BLEED }]} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 27, 27, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: R.md,
    borderTopRightRadius: R.md,
    width: '100%',
    paddingTop: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  sheetBleed: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.full,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 24,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 111,
    flexDirection: 'row',
    gap: 10,
  },
  calBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calMonthCol: {
    gap: 4,
    minWidth: 34,
    alignItems: 'center',
  },
  calMonth: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  calWeekday: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.primary,
  },
  calYear: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 11,
    color: colors.primary,
  },
  eventDetails: {
    flex: 1,
    gap: 10,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  eventDetailText: {
    flex: 1,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },
});
