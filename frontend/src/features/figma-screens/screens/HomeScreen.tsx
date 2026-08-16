import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar, type BottomNavTab } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionMinimizedBar,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { usePreferredName } from '@/features/onboarding/onboardingStore';
import {
  hydrateSessionStatsFromApi,
  useSessionStats,
} from '@/features/session-tracking/sessionStatsStore';
import {
  buildWeeklyHoursChart,
  computeWeeklyStreakHours,
  chartUsesMinuteScale,
  formatChartHourLabel,
  formatLifetimeServiceHoursValue,
  formatImpactPlacesCopy,
  formatWeekServiceHoursTotal,
  formatWeeklyHoursBadgeCopy,
  type SessionStatRecord,
} from '@/features/session-tracking/utils/homeDashboardStats';
import { roundHoursToMinutes } from '@/features/session-tracking/utils/sessionFormat';
import { useImpactFeed } from '@/features/session-tracking/impactFeedStore';

import { EmptyState } from '@/components/ui/EmptyState';

import { EventsViewAllModal } from '../components/EventsViewAllModal';
import { ImpactFeedSection } from '../components/ImpactFeedSection';
import { UpcomingEventCard } from '../components/UpcomingEventCard';
import { ServiceHoursWeekPicker } from '../components/ServiceHoursWeekPicker';
import {
  NotificationIcon,
  StreakIcon,
} from '../components/HomeIcons';
import { firstTimeHomeDashboard } from '../mocks/home';
import type { HomeDashboardData, UpcomingEventSummary } from '../mocks/home.types';
import { getTimeOfDayGreeting } from '../utils/getTimeOfDayGreeting';
import {
  formatWeekNumberLabel,
  formatWeekRangeLabel,
  getCurrentWeekMeta,
  parseIsoDate,
} from '../utils/weekCalendar';
import { layout, colors, fontFamilies, radius as R, shadows } from '../tokens';
import {
  fetchPublishedEventsCatalog,
  fetchPublishedUpcomingEvents,
} from '@/lib/eventsApi';

const CHART_H = 168;
/** Headroom above bars when minute labels (e.g. `18 min`) render outside narrow columns. */
const CHART_MINUTE_LABEL_BAND = 14;

/**
 * Round up to an integer ceiling with 4 equal integer Y-axis steps
 * (avoids decimal ticks like 37.5 / 7.5 when max is not divisible by 4).
 */
function niceMax(max: number): number {
  if (max <= 0) return 4;
  const step = Math.max(1, Math.ceil(max / 4));
  return step * 4;
}

function buildYLabels(chartMax: number): number[] {
  const step = chartMax / 4;
  return [chartMax, step * 3, step * 2, step, 0].map((v) => Math.round(v));
}

function yLabelTop(index: number, labelCount: number, labelBand = 0, plotH = CHART_H): number {
  if (index === 0) return labelBand - 6;
  const anchor = labelBand + (index / (labelCount - 1)) * plotH;
  if (index === labelCount - 1) return anchor - 10;
  return anchor - 5;
}

function gridLineTop(index: number, labelCount: number, labelBand = 0, plotH = CHART_H): number {
  return labelBand + (index / (labelCount - 1)) * plotH;
}

function BarChart({ weeklyHoursChart }: { weeklyHoursChart: HomeDashboardData['weeklyHoursChart'] }) {
  const dataMaxHours = Math.max(...weeklyHoursChart.map((d) => d.value), 0);
  const useMinutes = chartUsesMinuteScale(dataMaxHours);
  const dataMax = useMinutes ? roundHoursToMinutes(dataMaxHours) : dataMaxHours;
  const chartMax = niceMax(dataMax);
  const yLabels = buildYLabels(chartMax);
  const labelCount = yLabels.length;
  const labelBand = useMinutes ? CHART_MINUTE_LABEL_BAND : 0;
  const plotH = CHART_H - labelBand;

  return (
    <View style={chart.container}>
      <View style={chart.yAxis}>
        {yLabels.map((value, index) => (
          <Text
            key={value}
            style={[chart.yLabel, { top: yLabelTop(index, labelCount, labelBand, plotH) }]}
          >
            {value}
          </Text>
        ))}
      </View>
      <View style={chart.plotArea}>
        <View style={[chart.barsRow, labelBand > 0 && { paddingTop: labelBand }]}>
          {yLabels.map((value, index) => {
            if (value <= 0 || value >= chartMax) return null;
            const top = gridLineTop(index, labelCount, labelBand, plotH);
            return <View key={`grid-${value}`} style={[chart.gridLine, { top }]} />;
          })}
          {weeklyHoursChart.map(({ day, value }) => {
            const plotValue = useMinutes ? roundHoursToMinutes(value) : value;
            const barH = Math.round((plotValue / chartMax) * plotH);
            const label = formatChartHourLabel(value);
            const minuteLabel = label.endsWith(' min');
            const labelAbove = value > 0 && (minuteLabel || barH <= 20);
            const labelInside = value > 0 && !labelAbove;
            return (
              <View key={day} style={chart.barColumn}>
                {labelAbove && (
                  <Text style={chart.barValueAbove} numberOfLines={1}>
                    {label}
                  </Text>
                )}
                {value > 0 && (
                  <View style={[chart.bar, { height: Math.max(barH, 4) }]}>
                    {labelInside && (
                      <Text style={chart.barValue} numberOfLines={1}>
                        {label}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <View style={chart.xLabelsRow}>
          {weeklyHoursChart.map(({ day }) => (
            <Text key={day} style={chart.xLabel}>
              {day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function ServiceHoursCard({
  serviceHoursTotalLabel,
  weekStartIso,
  weekRangeLabel,
  weekNumberLabel,
  weeklyHoursChart,
  hasLifetimeHours,
  onLogSession,
  onWeekStartChange,
}: Pick<
  HomeDashboardData,
  'serviceHoursTotalLabel' | 'weekStartIso' | 'weekRangeLabel' | 'weekNumberLabel' | 'weeklyHoursChart'
> & {
  hasLifetimeHours: boolean;
  onLogSession: () => void;
  onWeekStartChange: (weekStartIso: string) => void;
}) {
  return (
    <View style={s.serviceHoursCard}>
      <View style={s.rowBetween}>
        <Text style={s.sectionTitle}>Service Hours</Text>
        <Text style={s.hoursValue}>{serviceHoursTotalLabel}</Text>
      </View>

      <ServiceHoursWeekPicker
        weekStartIso={weekStartIso}
        weekRangeLabel={weekRangeLabel}
        weekNumberLabel={weekNumberLabel}
        onWeekStartChange={onWeekStartChange}
      />

      <BarChart weeklyHoursChart={weeklyHoursChart} />

      {!hasLifetimeHours ? (
        <EmptyState
          title="No service hours yet"
          body="Tracking starts from the center Track button. Your weekly chart will fill in after your first session."
          ctaLabel="Log session?"
          ctaAccessibilityLabel="Log session"
          onCtaPress={onLogSession}
        />
      ) : null}
    </View>
  );
}

function RecentEventsSection({
  recentEvents,
  allEvents,
}: {
  recentEvents: HomeDashboardData['recentEvents'];
  allEvents: HomeDashboardData['allEvents'];
}) {
  const router = useRouter();
  const [viewAllVisible, setViewAllVisible] = useState(false);

  function openEventDetail(eventId: string) {
    setViewAllVisible(false);
    router.push({ pathname: '/event-detail', params: { id: eventId } } as Href);
  }

  const hasCatalog = allEvents.length > 0;

  return (
    <View style={s.eventsSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Upcoming Events</Text>
        {hasCatalog ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="View all events"
            onPress={() => setViewAllVisible(true)}
            hitSlop={8}
          >
            <Text style={s.viewAllLink}>View All</Text>
          </AnimatedPressable>
        ) : null}
      </View>
      {recentEvents.length > 0 ? (
        <View style={s.listGap}>
          {recentEvents.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              onPress={() => openEventDetail(event.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No upcoming events yet"
          body="Check back soon for community clean-ups near you."
        />
      )}
      <EventsViewAllModal
        visible={viewAllVisible}
        events={allEvents}
        onClose={() => setViewAllVisible(false)}
        onSelectEvent={openEventDetail}
      />
    </View>
  );
}

/**
 * Home dashboard (Figma `home_dashboard___final_branding`, node `406:291`).
 * Pass `data` to render a specific mock variant; defaults to first-time user.
 */
export function HomeScreenWithData({
  data,
  sessionStats = [],
  onWeekStartChange = () => {},
}: {
  data: HomeDashboardData;
  sessionStats?: readonly SessionStatRecord[];
  onWeekStartChange?: (weekStartIso: string) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const greeting = useMemo(() => getTimeOfDayGreeting(), []);
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 24;
  const hasLifetimeHours = Number.parseFloat(data.lifetimeServiceHoursValue) > 0;

  function openSessionSetup() {
    router.push('/session-setup-guide' as Href);
  }

  return (
    <View style={s.root}>
      <View style={[s.appBar, shadows.barTop, { paddingTop: insets.top + 8 }]}>
        <Text style={s.appBarTitle}>Clean Up Give Back</Text>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${data.notificationCount} unread`}
          style={s.notifWrap}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
        >
          <NotificationIcon size={20} color={colors.textPrimary} />
          {data.notificationCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{data.notificationCount}</Text>
            </View>
          )}
        </AnimatedPressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.greeting}>
          <Text style={s.greetingText}>
            {greeting}, <Text style={s.greetingName}>{data.homeUser.firstName}!</Text>
          </Text>
          {data.weeklyStreakHours > 0 && (
            <View
              style={s.streakBadge}
              accessible
              accessibilityRole="text"
              accessibilityLabel={formatWeeklyHoursBadgeCopy(data.weeklyStreakHours)}
            >
              <StreakIcon color={colors.textPrimary} />
              <Text style={s.streakText}>{formatWeeklyHoursBadgeCopy(data.weeklyStreakHours)}</Text>
            </View>
          )}
        </View>

        <ServiceHoursCard
          serviceHoursTotalLabel={data.serviceHoursTotalLabel}
          weekStartIso={data.weekStartIso}
          weekRangeLabel={data.weekRangeLabel}
          weekNumberLabel={data.weekNumberLabel}
          weeklyHoursChart={data.weeklyHoursChart}
          hasLifetimeHours={hasLifetimeHours}
          onLogSession={openSessionSetup}
          onWeekStartChange={onWeekStartChange}
        />
        <ImpactFeedSection
          sessionStats={sessionStats}
          feedItems={data.impactFeed}
          onFeedItemPress={(sessionId) =>
            router.push(`/session-detail?id=${encodeURIComponent(sessionId)}` as Href)
          }
          onViewAllPress={() => router.push('/sessions-list' as Href)}
          onLogSession={openSessionSetup}
        />
        <RecentEventsSection recentEvents={data.recentEvents} allEvents={data.allEvents} />
      </ScrollView>


      <View style={s.bottomStack}>
        {isActive && (
          <LiveSessionMinimizedBar barStyle={barStyle} onExpand={expandLiveSession} />
        )}
        <View style={[s.navBarBg, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab={activeTab}
          onHomePress={() => setActiveTab('home')}
          onShopPress={() => {
            setActiveTab('shop');
            router.push('/shop' as Href);
          }}
          onTrackPress={onTrackPress}
          onSessionsPress={() => {
            setActiveTab('sessions');
            router.push('/sessions-list' as Href);
          }}
          onProfilePress={() => {
            setActiveTab('profile');
            router.push('/account' as Href);
          }}
        />
        </View>
      </View>
    </View>
  );
}

/** First-time user home — session-driven stats, current calendar week. */
export function HomeScreen() {
  const preferredName = usePreferredName();
  const sessionStats = useSessionStats();
  const impactFeed = useImpactFeed();
  const [selectedWeekStartIso, setSelectedWeekStartIso] = useState(
    () => getCurrentWeekMeta().weekStartIso,
  );
  const [liveUpcomingEvents, setLiveUpcomingEvents] = useState<UpcomingEventSummary[] | null>(null);
  const [liveAllEvents, setLiveAllEvents] = useState<UpcomingEventSummary[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void hydrateSessionStatsFromApi();
      let cancelled = false;
      void (async () => {
        const [upcoming, catalog] = await Promise.all([
          fetchPublishedUpcomingEvents(),
          fetchPublishedEventsCatalog(),
        ]);
        if (cancelled) return;
        setLiveUpcomingEvents(upcoming);
        setLiveAllEvents(catalog.length > 0 ? catalog : upcoming);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const data = useMemo(() => {
    const selectedWeekStart = parseIsoDate(selectedWeekStartIso);
    const recentEvents = liveUpcomingEvents ?? [];
    const allEvents = liveAllEvents ?? [];

    return {
      ...firstTimeHomeDashboard,
      weekStartIso: selectedWeekStartIso,
      weekRangeLabel: formatWeekRangeLabel(selectedWeekStart),
      weekNumberLabel: formatWeekNumberLabel(selectedWeekStart),
      weeklyHoursChart: buildWeeklyHoursChart(sessionStats, selectedWeekStartIso),
      serviceHoursTotalLabel: formatWeekServiceHoursTotal(sessionStats, selectedWeekStartIso),
      weeklyStreakHours: computeWeeklyStreakHours(sessionStats),
      lifetimeServiceHoursValue: formatLifetimeServiceHoursValue(sessionStats),
      lifetimePlacesCopy: formatImpactPlacesCopy(sessionStats),
      impactFeed,
      recentEvents: recentEvents.slice(0, 3),
      allEvents,
      homeUser: {
        firstName: preferredName || firstTimeHomeDashboard.homeUser.firstName,
      },
    };
  }, [
    liveAllEvents,
    liveUpcomingEvents,
    preferredName,
    impactFeed,
    selectedWeekStartIso,
    sessionStats,
  ]);

  return (
    <HomeScreenWithData
      data={data}
      sessionStats={sessionStats}
      onWeekStartChange={setSelectedWeekStartIso}
    />
  );
}

const chart = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
    alignItems: 'flex-start',
  },
  /** Left edge matches the week-picker chevron glyph (icon tip sits ~8px inside the 24px box). */
  yAxis: {
    width: 28,
    height: CHART_H,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    left: 8,
    width: 20,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 11,
    lineHeight: 11,
    color: colors.primary,
    textAlign: 'left',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderOutline,
    zIndex: 0,
  },
  plotArea: {
    flex: 1,
  },
  barsRow: {
    height: CHART_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    paddingHorizontal: 2,
    gap: 1,
    position: 'relative',
    overflow: 'visible',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    zIndex: 1,
    overflow: 'visible',
  },
  bar: {
    width: '88%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 2,
    minHeight: 4,
  },
  barValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
    lineHeight: 13,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  barValueAbove: {
    alignSelf: 'stretch',
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
    lineHeight: 13,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 1,
  },
  xLabelsRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  xLabel: {
    flex: 1,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 11,
    color: colors.primary,
    textAlign: 'center',
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  appBar: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  appBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    color: colors.primary,
  },
  notifWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 22,
  },
  greeting: {
    gap: 6,
  },
  greetingText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 24,
    color: colors.textPrimary,
  },
  greetingName: {
    color: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLime,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  serviceHoursCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingTop: 19,
    paddingBottom: 19,
    gap: 20,
  },
  eventsSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  viewAllLink: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  listGap: {
    gap: 20,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarBg: {
    backgroundColor: colors.white,
    ...shadows.navBottom,
  },
});
