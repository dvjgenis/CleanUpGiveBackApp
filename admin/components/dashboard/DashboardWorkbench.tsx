'use client';

import Link from 'next/link';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { DonutChart } from '@/components/ui/DonutChart';
import { TrendAreaChart } from '@/components/ui/TrendAreaChart';
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';
import { CourtProgressChart } from '@/components/ui/CourtProgressChart';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ReviewDrawer } from '@/components/dashboard/ReviewDrawer';
import { MetroHeatmap } from '@/components/dashboard/MetroHeatmap';
import type {
  ChartExtras,
  CourtRiskItem,
  DashboardKpi,
  DonutPayload,
  NeighborhoodStats,
  ReviewableSession,
} from '@/components/dashboard/types';
import { approveSession, declineSession } from '@/actions/sessions';
import type { DashboardPeriod } from '@/lib/dashboard-period';

type Props = {
  period: DashboardPeriod;
  periodLabelText: string;
  isMock: boolean;
  kpis: DashboardKpi[];
  hoursKpi: DashboardKpi;
  queue: ReviewableSession[];
  recent: ReviewableSession[];
  courtRisk: CourtRiskItem[];
  donuts: DonutPayload[];
  chartExtras: ChartExtras;
  neighborhoodStats: NeighborhoodStats[];
};

function formatDurationShort(seconds: number | null, adjusted: number | null): string {
  if (adjusted != null) return `${adjusted.toFixed(1)}h`;
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function Bento({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-md border border-border-outline bg-bg-surface overflow-hidden ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Bento Today — sparse grid: one job per tile.
 * Primary: Review. Secondary: metrics + court. Tertiary: insights (collapsed).
 */
export function DashboardWorkbench(props: Props) {
  const { pushToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queue, setQueue] = useState(props.queue);
  const [recent, setRecent] = useState(props.recent);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    setQueue(props.queue);
    setRecent(props.recent);
  }, [props.queue, props.recent]);

  const drawerSession = useMemo(
    () => queue.find((s) => s.id === drawerId) ?? null,
    [queue, drawerId],
  );

  const underReviewKpi = props.kpis.find((k) => k.label === 'Under Review');
  const approvedKpi = props.kpis.find((k) => k.label === 'Approved');
  const courtKpi = props.kpis.find((k) => k.label === 'Court hours at risk');
  const feedbackKpi = props.kpis.find((k) => k.label === 'Avg feedback');

  const removeFromQueue = useCallback((id: string, nextStatus: string) => {
    setQueue((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      setDrawerId((current) => {
        if (current !== id) return current;
        return remaining[0]?.id ?? null;
      });
      return remaining;
    });
    setRecent((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)),
    );
  }, []);

  const restoreSession = useCallback((session: ReviewableSession) => {
    setQueue((prev) => {
      if (prev.some((s) => s.id === session.id)) return prev;
      return [...prev, { ...session, status: 'under_review' }].sort((a, b) => {
        if (a.court_ordered !== b.court_ordered) return a.court_ordered ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    setRecent((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: 'under_review' } : s)),
    );
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      const session = queue.find((s) => s.id === id) ?? recent.find((s) => s.id === id);
      if (!session) return;
      setBusyId(id);
      try {
        if (props.isMock) {
          removeFromQueue(id, 'approved');
          pushToast({
            kind: 'success',
            message: `Demo: approved ${session.volunteer_name}`,
            action: { label: 'Undo', onClick: () => restoreSession(session) },
          });
        } else {
          await approveSession(id);
          removeFromQueue(id, 'approved');
          pushToast({
            kind: 'success',
            message: `Approved ${session.volunteer_name}`,
            action: { label: 'Audit log', onClick: () => router.push('/audit-log') },
          });
          startTransition(() => router.refresh());
        }
      } catch (err) {
        pushToast({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Approve failed',
        });
      } finally {
        setBusyId(null);
      }
    },
    [queue, recent, props.isMock, removeFromQueue, pushToast, restoreSession, router],
  );

  const openOldest = useCallback(() => {
    if (queue[0]) setDrawerId(queue[0].id);
  }, [queue]);

  const submitDecline = useCallback(async () => {
    if (!declineId) return;
    const session = queue.find((s) => s.id === declineId) ?? recent.find((s) => s.id === declineId);
    if (!session) return;
    setBusyId(declineId);
    try {
      if (props.isMock) {
        removeFromQueue(declineId, 'not_approved');
        pushToast({
          kind: 'info',
          message: `Demo: declined ${session.volunteer_name}`,
          action: { label: 'Undo', onClick: () => restoreSession(session) },
        });
      } else {
        await declineSession(declineId, declineReason.trim() || undefined);
        removeFromQueue(declineId, 'not_approved');
        pushToast({
          kind: 'success',
          message: `Declined ${session.volunteer_name}`,
          action: { label: 'Audit log', onClick: () => router.push('/audit-log') },
        });
        startTransition(() => router.refresh());
      }
      setDeclineId(null);
      setDeclineReason('');
    } catch (err) {
      pushToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Decline failed',
      });
    } finally {
      setBusyId(null);
    }
  }, [
    declineId,
    declineReason,
    queue,
    recent,
    props.isMock,
    removeFromQueue,
    pushToast,
    restoreSession,
    router,
  ]);

  const visibleQueue = queue.slice(0, 5);
  const hasMoreQueue = queue.length > 5;

  return (
    <div className={`max-w-6xl mx-auto ${isPending ? 'opacity-70' : ''}`}>
      {props.isMock && (
        <p
          role="status"
          className="mb-md font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary"
        >
          Mock preview — decisions stay local
        </p>
      )}

      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between mb-lg">
        <h1 className="font-heading text-[32px] leading-[40px] text-text-primary">Today</h1>
        <Suspense fallback={<div className="h-11 w-52 bg-bg-surface-elevated rounded-md animate-pulse" />}>
          <PeriodToggle period={props.period} pending={isPending} />
        </Suspense>
      </header>

      {/* Bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md auto-rows-fr">
        {/* Hero — Review */}
        <Bento
          as="section"
          aria-labelledby="bento-review-heading"
          className="col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col min-h-[22rem]"
        >
          <div className="px-lg pt-lg pb-md flex items-start justify-between gap-md">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
                Needs you
              </p>
              <h2
                id="bento-review-heading"
                className="font-heading text-[24px] leading-[30px] text-text-primary"
              >
                {queue.length === 0
                  ? 'All clear'
                  : `${queue.length} to review`}
              </h2>
            </div>
            {queue.length > 0 && (
              <Button type="button" className="min-h-11 shrink-0" onClick={openOldest}>
                Start
              </Button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-lg pb-lg">
              <p className="font-body text-[14px] text-text-tertiary text-center max-w-xs">
                Nothing waiting. New submissions will show up here.
              </p>
            </div>
          ) : (
            <ul role="list" className="flex-1 divide-y divide-border-outline border-t border-border-outline">
              {visibleQueue.map((item) => (
                <li
                  key={item.id}
                  className="px-lg py-md flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[14px] font-semibold text-text-primary truncate">
                      {item.volunteer_name}
                      {item.court_ordered ? (
                        <span className="ml-xs font-data text-[10px] font-bold text-[#835400]">
                          COURT
                        </span>
                      ) : null}
                    </p>
                    <p className="font-body text-[12px] text-text-tertiary truncate">
                      {item.activity ?? 'Cleanup'} ·{' '}
                      {formatDurationShort(item.duration_seconds, item.adjusted_hours)} ·{' '}
                      {item.ageLabel}
                    </p>
                  </div>
                  <div className="flex gap-xs shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11"
                      disabled={busyId === item.id}
                      aria-label={`Approve ${item.volunteer_name}`}
                      onClick={() => handleApprove(item.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="min-h-11"
                      aria-label={`Review ${item.volunteer_name}`}
                      onClick={() => setDrawerId(item.id)}
                    >
                      Review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMoreQueue && (
            <div className="px-lg py-md border-t border-border-outline">
              <Link
                href="/sessions?status=under_review"
                className="font-data text-[12px] font-semibold text-primary hover:underline"
              >
                +{queue.length - 5} more in Sessions →
              </Link>
            </div>
          )}
        </Bento>

        {/* Metric tiles */}
        <MetricTile
          label="Waiting"
          value={underReviewKpi?.value ?? queue.length}
          hint={queue.length > 0 ? 'Open queue' : 'Caught up'}
          href="/sessions?status=under_review"
          accent={queue.length > 0}
        />
        <MetricTile
          label="Approved"
          value={approvedKpi?.value ?? '—'}
          hint={props.periodLabelText}
          href="/sessions?status=approved"
        />
        <MetricTile
          label="Hours"
          value={props.hoursKpi.value}
          hint={props.hoursKpi.delta ?? props.hoursKpi.subtext}
          href="/sessions?status=approved"
        />
        <MetricTile
          label="Feedback"
          value={feedbackKpi?.value ?? '—'}
          hint="Average rating"
          href="/feedback"
        />

        {/* Court tile */}
        <Bento
          as="section"
          aria-labelledby="bento-court-heading"
          className="col-span-2 lg:col-span-2"
        >
          <div className="px-lg pt-lg pb-sm flex items-center justify-between gap-md">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
                Deadlines
              </p>
              <h2
                id="bento-court-heading"
                className="font-heading text-[20px] leading-[26px] text-text-primary"
              >
                Court hours
              </h2>
            </div>
            <Link
              href="/court-hours"
              className="font-data text-[12px] font-semibold text-primary hover:underline min-h-11 inline-flex items-center"
            >
              All →
            </Link>
          </div>
          {props.courtRisk.length === 0 ? (
            <p className="px-lg pb-lg font-body text-[14px] text-text-tertiary">
              No one at risk right now.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-border-outline border-t border-border-outline">
              {props.courtRisk.slice(0, 3).map((v) => {
                const remaining = Math.max(0, v.requiredHours - v.completedHours);
                const daysLeft = daysUntilDue(v.dueDate);
                const behind = v.status === 'at_risk';
                return (
                  <li key={v.id}>
                    <Link
                      href={`/volunteers/${v.id}`}
                      className="flex items-center justify-between gap-md px-lg py-md hover:bg-bg-app transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <div className="min-w-0">
                        <p className="font-body text-[14px] font-semibold text-text-primary truncate">
                          {v.name}
                        </p>
                        <p className="font-data text-[12px] text-text-tertiary">
                          {remaining.toFixed(1)}h left
                          {Number.isFinite(daysLeft)
                            ? ` · ${daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`font-data text-[10px] uppercase font-semibold shrink-0 ${
                          behind ? 'text-[#ba1a1a]' : 'text-[#835400]'
                        }`}
                      >
                        {behind ? 'Behind' : 'Soon'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Bento>

        {/* Shortcut tile */}
        <Bento className="col-span-2 lg:col-span-2 flex flex-col justify-between p-lg gap-md">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
              Jump to
            </p>
            <h2 className="font-heading text-[20px] leading-[26px] text-text-primary mb-md">
              Common work
            </h2>
            <ul className="flex flex-col gap-xs" role="list">
              {(
                [
                  ['/sessions?status=under_review', 'Sessions under review'],
                  ['/court-hours', 'Court progress'],
                  ['/orders', 'Shop orders'],
                  ['/feedback', 'Volunteer feedback'],
                ] as const
              ).map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-[14px] text-primary hover:underline underline-offset-2 min-h-11 inline-flex items-center"
                  >
                    {label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {courtKpi && (
            <p className="font-data text-[12px] text-text-tertiary">
              {String(courtKpi.value)} court volunteers flagged · {props.periodLabelText}
            </p>
          )}
        </Bento>
      </div>

      {/* Single insights drawer — charts + map */}
      <details
        className="mt-lg group"
        open={insightsOpen}
        onToggle={(e) => setInsightsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none min-h-11 flex items-center justify-between rounded-md border border-border-outline bg-bg-surface px-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <span className="font-heading text-[18px] text-text-primary">Insights</span>
          <span className="font-data text-[12px] text-primary" aria-hidden>
            {insightsOpen ? 'Hide' : 'Show charts & map'}
          </span>
        </summary>
        {/* Mount charts only when open — avoids SSR hydration mismatches from motion prefs */}
        {insightsOpen ? (
          <div className="mt-md flex flex-col gap-md">
            <TrendAreaChart
              title="Hours & submissions"
              subtitle={props.periodLabelText}
              data={props.chartExtras.trend}
              index={0}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <HorizontalBarChart
                title="Queue age"
                data={props.chartExtras.queueAge}
                emptyLabel="Queue is empty"
                index={1}
              />
              <HorizontalBarChart
                title="Decisions"
                data={props.chartExtras.decisions}
                index={2}
              />
              <CourtProgressChart
                title="Court progress"
                data={props.chartExtras.courtProgress}
                index={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {props.donuts.map((d, i) => (
                <DonutChart key={d.title} title={d.title} data={d.data} total={d.total} index={i + 4} />
              ))}
            </div>
            <MetroHeatmap
              stats={props.neighborhoodStats}
              periodLabel={props.periodLabelText}
              isMock={props.isMock}
            />
          </div>
        ) : null}
      </details>

      <ReviewDrawer
        open={drawerId != null}
        session={drawerSession}
        queue={queue}
        isMock={props.isMock}
        busyId={busyId}
        onClose={() => setDrawerId(null)}
        onSelect={setDrawerId}
        onApprove={handleApprove}
        onDeclineRequest={setDeclineId}
      />

      {declineId && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-lg"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
            aria-label="Cancel decline"
            onClick={() => {
              setDeclineId(null);
              setDeclineReason('');
            }}
          />
          <div className="relative w-full max-w-md rounded-md bg-bg-surface border border-border-outline p-lg shadow-bar-top">
            <h3 className="font-heading text-[20px] text-text-primary mb-sm">Decline session</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-border-outline bg-bg-app px-md py-sm font-body text-[14px] mb-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              placeholder="Reason (optional)"
            />
            <div className="flex gap-sm justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeclineId(null);
                  setDeclineReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busyId === declineId}
                onClick={submitDecline}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string | null;
  href: string;
  accent?: boolean;
}) {
  return (
    <Bento as="article" className="col-span-1">
      <Link
        href={href}
        className="block h-full p-lg no-underline text-inherit hover:bg-bg-app/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary min-h-[7.5rem]"
        aria-label={`${label}: ${value}`}
      >
        <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm">
          {label}
        </p>
        <p
          className={`font-data text-[28px] leading-[34px] font-semibold ${
            accent ? 'text-[#835400]' : 'text-text-primary'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-xs font-body text-[12px] text-text-tertiary line-clamp-2">{hint}</p>
        ) : null}
      </Link>
    </Bento>
  );
}
