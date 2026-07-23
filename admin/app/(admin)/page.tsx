import { createClient } from '@/lib/supabase/server';
import { DashboardWorkbench } from '@/components/dashboard/DashboardWorkbench';
import {
  MOCK_COURT_AT_RISK,
  MOCK_FEEDBACK_AVG,
  MOCK_OPEN_ORDERS,
  MOCK_SESSIONS,
  type MockSession,
} from '@/lib/dashboard-mock';
import {
  inInterval,
  parsePeriod,
  periodInterval,
  periodLabel,
  previousPeriodInterval,
  type DashboardPeriod,
} from '@/lib/dashboard-period';
import { computedHours } from '@/lib/format';
import { METRO_NEIGHBORHOODS, type NeighborhoodStats } from '@/lib/metro-heatmap';
import {
  buildCourtProgressBars,
  buildDecisionBars,
  buildQueueAgeBars,
  buildTrendSeries,
} from '@/lib/dashboard-charts';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const RATING_SCORES: Record<string, number> = {
  excited: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  very_sad: 1,
};

function ageLabel(iso: string | null | undefined, now: Date): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    const hours = differenceInHours(now, d);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = differenceInDays(now, d);
    if (days === 1) return '1d ago';
    if (days < 14) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function sessionHours(s: { adjusted_hours: number | null; duration_seconds: number | null }): number {
  return computedHours(s.duration_seconds, s.adjusted_hours);
}

function filterByEndedAt<T extends { ended_at?: string | null; started_at?: string | null }>(
  rows: T[],
  period: DashboardPeriod,
  now: Date,
): T[] {
  const interval = periodInterval(period, now);
  return rows.filter((r) => inInterval(r.ended_at ?? r.started_at, interval));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const supabase = await createClient();
  const now = new Date();
  const interval = periodInterval(period, now);
  const prevInterval = previousPeriodInterval(period, now);

  const [{ data: allSessions }, { data: feedbackRows }, { count: openOrdersCount }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select(
          'id, user_id, activity, started_at, ended_at, created_at, status, duration_seconds, adjusted_hours, court_ordered, distance_miles',
        )
        .order('created_at', { ascending: false }),
      supabase.from('volunteer_feedback').select('rating, submitted_at'),
      supabase
        .from('shop_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'paid', 'shipped']),
    ]);

  const useMock = !allSessions || allSessions.length === 0;
  const sessions: MockSession[] = useMock
    ? MOCK_SESSIONS
    : (allSessions as MockSession[]).map((s) => ({
        ...s,
        volunteer_name: s.volunteer_name ?? 'Volunteer',
        started_at: s.started_at ?? s.created_at,
        ended_at: s.ended_at ?? s.started_at ?? s.created_at,
        created_at: s.created_at ?? s.started_at ?? now.toISOString(),
        neighborhood_id: s.neighborhood_id ?? 'midtown',
      }));

  const scoped = filterByEndedAt(sessions, period, now);
  const prevScoped = prevInterval
    ? sessions.filter((s) => inInterval(s.ended_at ?? s.started_at, prevInterval))
    : [];

  const statusCounts = {
    under_review: scoped.filter((s) => s.status === 'under_review').length,
    approved: scoped.filter((s) => s.status === 'approved').length,
    not_approved: scoped.filter((s) => s.status === 'not_approved').length,
    active: scoped.filter((s) => s.status === 'active').length,
    invalid: scoped.filter((s) => s.status === 'invalid').length,
  };
  const totalSessions = scoped.length;

  const statusSlices = [
    { name: 'Approved', value: statusCounts.approved, color: '#007536' },
    { name: 'Under Review', value: statusCounts.under_review, color: '#fcab29' },
    { name: 'Declined', value: statusCounts.not_approved, color: '#ba1a1a' },
    { name: 'Active', value: statusCounts.active, color: '#5a8f3a' },
    { name: 'Invalid', value: statusCounts.invalid, color: '#6e7a6c' },
  ].filter((s) => s.value > 0);

  const activityMap: Record<string, number> = {};
  scoped.forEach((s) => {
    const key = s.activity?.trim() || 'Other';
    activityMap[key] = (activityMap[key] ?? 0) + 1;
  });
  const ACTIVITY_COLORS = ['#007536', '#5a8f3a', '#835400', '#3d8f5c', '#6e7a6c'];
  const sortedActivities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]);
  const topActivities = sortedActivities.slice(0, 4);
  const otherCount = sortedActivities.slice(4).reduce((sum, [, v]) => sum + v, 0);
  const activitySlices = [
    ...topActivities.map(([name, value], i) => ({
      name,
      value,
      color: ACTIVITY_COLORS[i] ?? '#6e7a6c',
    })),
    ...(otherCount > 0 ? [{ name: 'Other', value: otherCount, color: '#6e7a6c' }] : []),
  ];

  const approvedScoped = scoped.filter((s) => s.status === 'approved');
  const courtOrdered = approvedScoped.filter((r) => r.court_ordered).length;
  const voluntary = approvedScoped.filter((r) => !r.court_ordered).length;
  const courtSlices = [
    { name: 'Voluntary', value: voluntary, color: '#007536' },
    { name: 'Court-ordered', value: courtOrdered, color: '#835400' },
  ].filter((s) => s.value > 0);

  const underReviewAll = sessions
    .filter((s) => s.status === 'under_review')
    .sort((a, b) => {
      if (a.court_ordered !== b.court_ordered) return a.court_ordered ? -1 : 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const approvedThisPeriod = approvedScoped.length;
  const declinedThisPeriod = scoped.filter((s) => s.status === 'not_approved').length;
  const totalApprovedHours = approvedScoped.reduce((sum, s) => sum + sessionHours(s), 0);
  const prevApprovedHours = prevScoped
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + sessionHours(s), 0);

  const hoursDelta =
    prevInterval && prevApprovedHours > 0
      ? `${totalApprovedHours >= prevApprovedHours ? '+' : ''}${Math.round(
          ((totalApprovedHours - prevApprovedHours) / prevApprovedHours) * 100,
        )}% vs prior`
      : prevInterval
        ? 'No prior period'
        : null;

  const hoursSparkline = [
    prevApprovedHours,
    Math.max(prevApprovedHours * 0.85, 0),
    Math.max(prevApprovedHours * 0.95, 0),
    totalApprovedHours,
  ];

  let ratingDisplay = '—';
  if (useMock) {
    ratingDisplay = MOCK_FEEDBACK_AVG.toFixed(1);
  } else if (feedbackRows && feedbackRows.length > 0) {
    const inPeriod = (feedbackRows as { rating: string | null; submitted_at: string }[]).filter(
      (f) => inInterval(f.submitted_at, interval),
    );
    if (inPeriod.length > 0) {
      const avg =
        inPeriod.reduce((sum, f) => sum + (f.rating ? (RATING_SCORES[f.rating] ?? 0) : 0), 0) /
        inPeriod.length;
      ratingDisplay = avg.toFixed(1);
    }
  }

  const courtAtRisk = MOCK_COURT_AT_RISK;
  const periodLabelText = periodLabel(period, now);

  const kpis = [
    {
      label: 'Under Review',
      value: underReviewAll.length,
      accent: underReviewAll.length > 0,
      subtext: underReviewAll.length > 0 ? 'Needs attention' : 'All clear',
      href: '/sessions?status=under_review',
    },
    {
      label: 'Approved',
      value: approvedThisPeriod,
      subtext: `${declinedThisPeriod} declined · ${periodLabelText}`,
      href: '/sessions?status=approved',
    },
    {
      label: 'Court hours at risk',
      value: courtAtRisk.filter((v) => v.status === 'at_risk').length,
      accent: courtAtRisk.some((v) => v.status === 'at_risk'),
      subtext: `${courtAtRisk.length} due soon or behind`,
      href: '/court-hours',
    },
    {
      label: 'Avg feedback',
      value: ratingDisplay,
      subtext: `Open orders: ${useMock ? MOCK_OPEN_ORDERS : (openOrdersCount ?? 0)}`,
      href: '/feedback',
    },
  ];

  const hoursKpi = {
    label: 'Approved hours',
    value: totalApprovedHours.toFixed(1),
    subtext: `${courtOrdered} court-ordered in period`,
    delta: hoursDelta,
    sparkline: prevInterval ? hoursSparkline : undefined,
    href: '/sessions?status=approved',
  };

  const toReviewable = (s: MockSession) => ({
    id: s.id,
    volunteer_name: s.volunteer_name,
    activity: s.activity,
    court_ordered: s.court_ordered,
    created_at: s.created_at,
    ageLabel: ageLabel(s.created_at, now),
    status: s.status,
    duration_seconds: s.duration_seconds,
    adjusted_hours: s.adjusted_hours,
    distance_miles: s.distance_miles,
    started_at: s.started_at,
    neighborhood_id: s.neighborhood_id,
  });

  const queue = underReviewAll.map(toReviewable);

  const recentSorted = [...scoped].sort((a, b) => {
    const aReview = a.status === 'under_review' ? 0 : 1;
    const bReview = b.status === 'under_review' ? 0 : 1;
    if (aReview !== bReview) return aReview - bReview;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const recent = recentSorted.slice(0, 10).map(toReviewable);

  const neighborhoodStats: NeighborhoodStats[] = METRO_NEIGHBORHOODS.map((n) => {
    const rows = scoped.filter((s) => s.neighborhood_id === n.id);
    const hours = rows.reduce((sum, s) => sum + sessionHours(s), 0);
    const underReview = rows.filter((s) => s.status === 'under_review').length;
    return {
      id: n.id,
      name: n.name,
      sessionCount: rows.length,
      hours,
      underReview,
    };
  });

  const chartExtras = {
    trend: buildTrendSeries(scoped, period, now, interval),
    queueAge: buildQueueAgeBars(underReviewAll, now),
    decisions: buildDecisionBars(scoped),
    courtProgress: buildCourtProgressBars(courtAtRisk),
  };

  return (
    <DashboardWorkbench
      period={period}
      periodLabelText={periodLabelText}
      isMock={useMock}
      kpis={kpis}
      hoursKpi={hoursKpi}
      queue={queue}
      recent={recent}
      courtRisk={courtAtRisk}
      neighborhoodStats={neighborhoodStats}
      chartExtras={chartExtras}
      donuts={[
        { title: 'Session Status', data: statusSlices, total: totalSessions },
        { title: 'Activity Types', data: activitySlices, total: totalSessions },
        {
          title: 'Approved — Session Type',
          data: courtSlices,
          total: courtOrdered + voluntary,
        },
      ]}
    />
  );
}
