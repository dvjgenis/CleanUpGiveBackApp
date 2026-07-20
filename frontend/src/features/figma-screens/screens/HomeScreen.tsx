import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar, type BottomNavTab } from '@/components/navigation/BottomNavBar';
import { usePreferredName } from '@/features/onboarding/onboardingStore';
import { LiveSessionMinimizedPill, LIVE_SESSION_PILL_MIN_HEIGHT } from '@/features/session-tracking/components/LiveSessionMinimizedPill';
import { useLiveSessionBarExit } from '@/features/session-tracking/hooks/useLiveSessionBarExit';
import {
  getCheckpointProgress,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { useRecentSessions } from '@/features/session-tracking/recentSessionsStore';
import { useSessionStats } from '@/features/session-tracking/sessionStatsStore';
import {
  buildImpactStats,
  buildWeeklyHoursChart,
  computeWeeklyStreakHours,
  formatWeekServiceHoursTotal,
} from '@/features/session-tracking/utils/homeDashboardStats';

import { EventsViewAllModal } from '../components/EventsViewAllModal';
import { RecentSessionCard } from '../components/RecentSessionCard';
import { ServiceHoursWeekPicker } from '../components/ServiceHoursWeekPicker';
import {
  EventCalendarDayBadge,
  EventLocationIcon,
  EventOrganizationIcon,
  ImpactStatIcon,
  NotificationIcon,
  StreakIcon,
  TimeIcon,
} from '../components/HomeIcons';
import { firstTimeHomeDashboard } from '../mocks/home';
import type { HomeDashboardData, ImpactStat } from '../mocks/home.types';
import { getTimeOfDayGreeting } from '../utils/getTimeOfDayGreeting';
import { formatEventMonthLabel } from '../utils/eventFormat';
import { getCurrentWeekMeta } from '../utils/weekCalendar';
import { layout, colors, fontFamilies, radius as R, shadows } from '../tokens';

const CHART_H = 168;
const LIVE_BAR_HEIGHT = LIVE_SESSION_PILL_MIN_HEIGHT + 16;

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

function yLabelTop(index: number, labelCount: number): number {
  if (index === 0) return -6;
  const anchor = (index / (labelCount - 1)) * CHART_H;
  if (index === labelCount - 1) return anchor - 10;
  return anchor - 5;
}

function BarChart({ weeklyHoursChart }: { weeklyHoursChart: HomeDashboardData['weeklyHoursChart'] }) {
  const dataMax = Math.max(...weeklyHoursChart.map((d) => d.value), 0);
  const chartMax = niceMax(dataMax);
  const yLabels = buildYLabels(chartMax);
  const labelCount = yLabels.length;

  return (
    <View style={chart.container}>
      <View style={chart.yAxis}>
        {yLabels.map((value, index) => (
          <Text key={value} style={[chart.yLabel, { top: yLabelTop(index, labelCount) }]}>
            {value}
          </Text>
        ))}
      </View>
      <View style={chart.plotArea}>
        <View style={chart.barsRow}>
          {yLabels.map((value, index) => {
            if (value <= 0 || value >= chartMax) return null;
            const top = (index / (labelCount - 1)) * CHART_H;
            return <View key={`grid-${value}`} style={[chart.gridLine, { top }]} />;
          })}
          {weeklyHoursChart.map(({ day, value }) => {
            const barH = Math.round((value / chartMax) * CHART_H);
            const labelAbove = value > 0 && barH <= 20;
            const labelInside = value > 0 && barH > 20;
            return (
              <View key={day} style={chart.barColumn}>
                {labelAbove && (
                  <Text style={chart.barValueAbove}>{value}</Text>
                )}
                {value > 0 && (
                  <View style={[chart.bar, { height: Math.max(barH, 4) }]}>
                    {labelInside && <Text style={chart.barValue}>{value}</Text>}
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
  onWeekStartChange,
}: Pick<
  HomeDashboardData,
  'serviceHoursTotalLabel' | 'weekStartIso' | 'weekRangeLabel' | 'weekNumberLabel' | 'weeklyHoursChart'
> & {
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
    </View>
  );
}

function ImpactStatCard({ icon, value, label }: { icon: ImpactStat['icon']; value: string; label: string }) {
  return (
    <View style={s.impactStatCard}>
      <View style={s.statValueRow}>
        <ImpactStatIcon name={icon} />
        <Text style={s.statValue}>{value}</Text>
      </View>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ImpactSection({ impactStats }: { impactStats: ImpactStat[] }) {
  const rows = [impactStats.slice(0, 2), impactStats.slice(2, 4)] as const;

  return (
    <View style={s.paddedSection}>
      <Text style={s.sectionTitle}>Your Impact</Text>
      <View style={s.impactGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={s.impactGridRow}>
            {row.map((stat) => (
              <ImpactStatCard key={stat.id} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function RecentSessionsSection({
  recentSessions,
  onSessionPress,
}: {
  recentSessions: HomeDashboardData['recentSessions'];
  onSessionPress?: (sessionId: string) => void;
}) {
  return (
    <View style={s.paddedSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Recent Sessions</Text>
        {recentSessions.length > 0 && (
          <View style={s.sectionHeaderActions}>
            <Text style={s.viewAllLink}>View All</Text>
          </View>
        )}
      </View>
      {recentSessions.length > 0 ? (
        <View style={s.listGap}>
          {recentSessions.map((session) => (
            <RecentSessionCard
              key={session.id}
              session={session}
              onPress={
                onSessionPress
                  ? () => onSessionPress(session.id)
                  : undefined
              }
            />
          ))}
        </View>
      ) : (
        <Text style={s.emptySectionMessage}>No recent sessions yet.</Text>
      )}
    </View>
  );
}

function EventCalendarBadge({ day, month, weekday }: { day: string; month: string; weekday: string }) {
  return (
    <View style={s.calBadgeRow}>
      <EventCalendarDayBadge day={day} />
      <View style={s.calMonthCol}>
        <Text style={s.calMonth}>{formatEventMonthLabel(month)}</Text>
        <Text style={s.calWeekday}>{weekday}</Text>
      </View>
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

  if (recentEvents.length === 0) {
    return null;
  }

  return (
    <View style={s.paddedSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Upcoming Events</Text>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="View all events"
          onPress={() => setViewAllVisible(true)}
          hitSlop={8}
        >
          <Text style={s.viewAllLink}>View All</Text>
        </AnimatedPressable>
      </View>
      <View style={s.listGap}>
        {recentEvents.map((event) => (
          <AnimatedPressable
            key={event.id}
            scaleTo={0.98}
            style={s.eventCard}
            onPress={() => openEventDetail(event.id)}
            accessibilityRole="button"
            accessibilityLabel={`Event on ${event.month} ${event.day} at ${event.location}`}
          >
            <EventCalendarBadge day={event.day} month={event.month} weekday={event.weekday} />
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
          </AnimatedPressable>
        ))}
      </View>
      <EventsViewAllModal
        visible={viewAllVisible}
        events={allEvents}
        onClose={() => setViewAllVisible(false)}
        onSelectEvent={openEventDetail}
      />
    </View>
  );
}

type LiveSessionBarProps = {
  barStyle: ReturnType<typeof useLiveSessionBarExit>['barStyle'];
  onExpand: () => void;
};

function LiveSessionBar({ barStyle, onExpand }: LiveSessionBarProps) {
  const { elapsedSeconds, checkpointSecondsRemaining, distanceMiles, submittedCheckpoints } =
    useLiveSession();
  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);

  return (
    <Animated.View style={[s.liveBar, barStyle]}>
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

/**
 * Home dashboard (Figma `home_dashboard___final_branding`, node `406:291`).
 * Pass `data` to render a specific mock variant; defaults to first-time user.
 */
export function HomeScreenWithData({
  data,
  onWeekStartChange = () => {},
}: {
  data: HomeDashboardData;
  onWeekStartChange?: (weekStartIso: string) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();
  const navigateLiveSession = useCallback(() => router.push('/live-session'), [router]);
  const { barStyle, expandLiveSession, resetBar } = useLiveSessionBarExit({
    onNavigate: navigateLiveSession,
  });

  useFocusEffect(
    useCallback(() => {
      resetBar();
    }, [resetBar]),
  );
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const greeting = useMemo(() => getTimeOfDayGreeting(), []);
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + (isActive ? LIVE_BAR_HEIGHT + 24 : 24);

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
          <NotificationIcon color={colors.textPrimary} />
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
            <View style={s.streakBadge}>
              <StreakIcon />
              <Text style={s.streakText}>
                {data.weeklyStreakHours} hour streak this week. Keep it up!
              </Text>
            </View>
          )}
        </View>

        <ServiceHoursCard
          serviceHoursTotalLabel={data.serviceHoursTotalLabel}
          weekStartIso={data.weekStartIso}
          weekRangeLabel={data.weekRangeLabel}
          weekNumberLabel={data.weekNumberLabel}
          weeklyHoursChart={data.weeklyHoursChart}
          onWeekStartChange={onWeekStartChange}
        />
        <ImpactSection impactStats={data.impactStats} />
        <RecentSessionsSection
          recentSessions={data.recentSessions}
          onSessionPress={(sessionId) =>
            router.push(`/session-detail?id=${encodeURIComponent(sessionId)}` as Href)
          }
        />
        <RecentEventsSection recentEvents={data.recentEvents} allEvents={data.allEvents} />
      </ScrollView>


      <View style={s.bottomStack}>
        {isActive && (
          <LiveSessionBar barStyle={barStyle} onExpand={expandLiveSession} />
        )}
        <View style={[s.navBarBg, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab={activeTab}
          onHomePress={() => setActiveTab('home')}
          onShopPress={() => {
            setActiveTab('shop');
            router.push('/shop' as Href);
          }}
          onTrackPress={() => {
            if (isActive) {
              expandLiveSession();
            } else {
              router.push('/session-setup-guide');
            }
          }}
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
  const recentSessions = useRecentSessions();
  const preferredName = usePreferredName();
  const sessionStats = useSessionStats();
  const [selectedWeekStartIso, setSelectedWeekStartIso] = useState(
    () => getCurrentWeekMeta().weekStartIso,
  );

  const data = useMemo(() => {
    const weekMeta = getCurrentWeekMeta();

    return {
      ...firstTimeHomeDashboard,
      ...weekMeta,
      weekStartIso: selectedWeekStartIso,
      weeklyHoursChart: buildWeeklyHoursChart(sessionStats, selectedWeekStartIso),
      serviceHoursTotalLabel: formatWeekServiceHoursTotal(sessionStats, selectedWeekStartIso),
      weeklyStreakHours: computeWeeklyStreakHours(sessionStats),
      impactStats: buildImpactStats(sessionStats),
      recentSessions,
      homeUser: {
        firstName: preferredName || firstTimeHomeDashboard.homeUser.firstName,
      },
    };
  }, [preferredName, recentSessions, selectedWeekStartIso, sessionStats]);

  return (
    <HomeScreenWithData data={data} onWeekStartChange={setSelectedWeekStartIso} />
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
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    zIndex: 1,
  },
  bar: {
    width: '88%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    minHeight: 4,
  },
  barValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
    color: colors.textOnPrimary,
  },
  barValueAbove: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 2,
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
    backgroundColor: colors.chipBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 12,
    color: colors.primary,
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
  paddedSection: {
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewAllLink: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    color: colors.primary,
  },
  emptySectionMessage: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hoursValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  impactGrid: {
    height: 246,
    gap: 15,
  },
  impactGridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  impactStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  statValueRow: {
    position: 'absolute',
    left: 13,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 32,
    color: colors.primary,
  },
  statLabel: {
    position: 'absolute',
    left: 13,
    top: 83,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },
  listGap: {
    gap: 20,
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
    gap: 5,
    width: 30,
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
  liveBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
