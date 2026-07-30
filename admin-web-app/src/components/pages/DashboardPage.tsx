"use client";

/**
 * Faithful port of the real admin "Bento Today" Dashboard
 * (`admin/components/dashboard/DashboardWorkbench.tsx` + supporting UI:
 * `MiniDonut`, `FeedbackEmojiStrip`, `HorizontalBarChart`, `TrendAreaChart`,
 * `UsHeatmap`, `PaymentsPreviewCard`, `OrdersPreviewCard`).
 *
 * `sessions`/`orders`/`monthly`/`feedbackAvg` are fetched live from Supabase
 * by `admin-web-app/src/app/dashboard/page.tsx` (see `@/lib/live-data`), falling
 * back to the same mock fixtures admin uses when those tables are empty. The
 * live review actions (approve/decline, drawer, search) are still read-only.
 */
import { Suspense, type ReactNode, type HTMLAttributes } from "react";
import Link from "next/link";
import { CourtBadge } from "@/components/ui/CourtBadge";
import { Button } from "@/components/ui/Button";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { MiniDonut, type MiniDonutSlice } from "@/components/ui/MiniDonut";
import { FeedbackEmojiStrip, type FeedbackEmojiCount } from "@/components/ui/FeedbackEmojiStrip";
import { HorizontalBarChart } from "@/components/ui/HorizontalBarChart";
import { TrendAreaChart } from "@/components/ui/TrendAreaChart";
import { PaymentsPreviewCard } from "@/components/ui/PaymentsPreviewCard";
import { OrdersPreviewCard } from "@/components/ui/OrdersPreviewCard";
import { UsHeatmap } from "@/components/dashboard/UsHeatmap";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { usePeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import {
  MOCK_SESSIONS,
  MOCK_FEEDBACK_AVG,
  MOCK_ORDERS,
  computedHours,
  buildQueueAgeBars,
  buildTrendSeries,
  buildMockMonthlyRevenue,
  buildGeoActivity,
  type MockSession,
  type OrderRow,
  type MonthlyRevenuePoint,
} from "@/lib/mock-data";

function ageLabel(iso: string, now: Date): string {
  const hours = Math.round((now.getTime() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function formatDurationShort(seconds: number | null, adjusted: number | null): string {
  if (adjusted != null) return `${adjusted.toFixed(1)}h`;
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Bento({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: { children: ReactNode; className?: string; as?: "div" | "section" | "article" } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-md border border-border-outline bg-bg-surface overflow-hidden ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function MetricTile({
  label,
  value,
  hint,
  href,
  accent,
  donut,
  emojiStrip,
}: {
  label: string;
  value: string | number;
  hint?: string | null;
  href: string;
  accent?: boolean;
  donut?: MiniDonutSlice[];
  emojiStrip?: FeedbackEmojiCount[];
}) {
  return (
    <Bento as="article" className="h-full min-h-0">
      <Link
        href={href}
        className="flex h-full flex-col justify-center p-md no-underline text-inherit hover:bg-bg-app/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`${label}: ${value}`}
      >
        <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">{label}</p>
        <div className="flex items-end justify-between gap-sm min-w-0">
          <p className={`font-data text-[22px] sm:text-[28px] leading-[28px] sm:leading-[34px] font-semibold shrink-0 ${accent ? "text-[#835400]" : "text-text-primary"}`}>
            {value}
          </p>
          {donut ? (
            <MiniDonut slices={donut} size={40} thickness={5} className="mb-0.5 shrink-0 sm:w-12 sm:h-12" />
          ) : emojiStrip ? (
            <FeedbackEmojiStrip counts={emojiStrip} className="mb-0.5 min-w-0 max-w-[5.5rem] sm:max-w-[7.5rem]" />
          ) : null}
        </div>
        {hint ? <p className="mt-xs font-body text-[12px] text-text-tertiary line-clamp-2">{hint}</p> : null}
      </Link>
    </Bento>
  );
}

export function DashboardPage({
  sessions = MOCK_SESSIONS,
  orders = MOCK_ORDERS,
  monthly: monthlyProp,
  feedbackAvg = MOCK_FEEDBACK_AVG,
  isMock = false,
}: {
  sessions?: MockSession[];
  orders?: OrderRow[];
  monthly?: MonthlyRevenuePoint[];
  feedbackAvg?: number;
  isMock?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full max-w-xl bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <DashboardPageInner
        sessions={sessions}
        orders={orders}
        monthly={monthlyProp ?? buildMockMonthlyRevenue()}
        feedbackAvg={feedbackAvg}
        isMock={isMock}
      />
    </Suspense>
  );
}

function DashboardPageInner({
  sessions,
  orders,
  monthly,
  feedbackAvg,
  isMock,
}: {
  sessions: MockSession[];
  orders: OrderRow[];
  monthly: MonthlyRevenuePoint[];
  feedbackAvg: number;
  isMock: boolean;
}) {
  const now = new Date();
  const selection = usePeriodSelection();
  const periodLabelText = usePeriodLabel(now);
  const queue = sessions.filter((s) => s.status === "under_review");
  const approved = sessions.filter((s) => s.status === "approved");
  const totalApprovedHours = approved.reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);
  const visibleQueue = queue.slice(0, 5);

  const waitingDonut: MiniDonutSlice[] = [{ value: Math.max(queue.length, 1), color: "#fcab29" }];
  const approvedDonut: MiniDonutSlice[] = [{ value: Math.max(approved.length, 1), color: "#007536" }];
  const hoursDonut: MiniDonutSlice[] = [{ value: Math.max(Math.round(totalApprovedHours), 1), color: "#5a8f3a" }];
  const feedbackEmojis: FeedbackEmojiCount[] = [
    { key: "excited", emoji: "🤩", label: "Excited", count: 5 },
    { key: "happy", emoji: "😊", label: "Happy", count: 4 },
    { key: "neutral", emoji: "😐", label: "Neutral", count: 2 },
    { key: "sad", emoji: "😔", label: "Sad", count: 1 },
    { key: "very_sad", emoji: "😢", label: "Very Sad", count: 0 },
  ];

  const queueAge = buildQueueAgeBars(queue, now);
  const hoursTrend = buildTrendSeries(sessions);

  const paymentsThisMonthCents = monthly[monthly.length - 1]
    ? monthly[monthly.length - 1].donationsCents + monthly[monthly.length - 1].shopCents
    : 0;
  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "paid" || o.status === "shipped");
  const ordersRevenueCents = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.totalCents, 0);

  const approvalRatePct = sessions.length > 0 ? Math.round((approved.length / sessions.length) * 100) : 0;
  const geoActivity = buildGeoActivity(sessions);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <h1 className="font-heading text-[26px] sm:text-[32px] leading-[34px] sm:leading-[40px] text-text-primary">
          Welcome back <span className="text-primary-brand">Donna</span>!
        </h1>
        <PeriodToggle selection={selection} />
      </header>

      {isMock && <SampleDataBanner />}

      {/* Bento grid — sibling columns share height so bottoms align */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
        {/* Hero — Review */}
        <Bento as="section" aria-labelledby="bento-review-heading" className="flex h-full flex-col">
          <div className="px-lg pt-lg pb-md flex items-start justify-between gap-md">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">Needs you</p>
              <h2 id="bento-review-heading" className="font-heading text-[24px] leading-[30px] text-text-primary">
                {queue.length === 0 ? "All clear" : `${queue.length} to review`}
              </h2>
            </div>
            {queue.length > 0 && (
              <Button type="button" className="min-h-11 shrink-0">
                Start
              </Button>
            )}
          </div>

          {queue.length > 0 && (
            <div className="px-lg pb-md flex flex-wrap gap-sm">
              <div className="h-11 flex items-center px-md rounded-full border border-border-outline bg-bg-surface font-data text-[13px] text-text-tertiary w-full sm:w-56">
                Search the queue…
              </div>
              <span className="h-11 shrink-0 inline-flex items-center px-md rounded-full border border-border-outline bg-bg-surface text-text-tertiary font-data text-[12px] font-semibold whitespace-nowrap">
                Court-ordered only
              </span>
            </div>
          )}

          {queue.length > 0 && (
            <div className="px-lg pb-md">
              <div className="px-md py-sm rounded-sm bg-[#f7fff1] border border-primary text-[12px] font-body text-text-tertiary">
                <strong className="text-primary font-semibold">Tip:</strong> Select multiple sessions with checkboxes to
                approve in bulk. Click any row to review details.
              </div>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="px-lg pb-lg flex-1 flex items-center">
              <p className="font-body text-[14px] text-text-tertiary max-w-xs">
                Nothing waiting. New submissions will show up here.
              </p>
            </div>
          ) : (
            <ul role="list" className="flex-1 divide-y divide-border-outline border-t border-border-outline">
              {visibleQueue.map((item) => (
                <li key={item.id} className="px-lg py-md flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md">
                  <input type="checkbox" className="w-4 h-4 accent-primary shrink-0" aria-label={`Select ${item.volunteer_name}`} readOnly />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-xs">
                      <Link
                        href={`/volunteers/${item.user_id}`}
                        className="font-body text-[14px] font-semibold text-text-primary truncate hover:text-primary hover:underline inline-block max-w-full"
                      >
                        {item.volunteer_name}
                      </Link>
                      {item.court_ordered && <CourtBadge className="shrink-0" />}
                    </div>
                    <p className="font-body text-[12px] text-text-tertiary truncate">
                      {item.activity ?? "Cleanup"} · {formatDurationShort(item.duration_seconds, item.adjusted_hours)} ·{" "}
                      {ageLabel(item.created_at, now)}
                    </p>
                  </div>
                  <div className="flex gap-xs shrink-0">
                    <Button type="button" size="sm" className="min-h-11" aria-label={`Review ${item.volunteer_name}`}>
                      Review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bento>

        {/* Metric tiles — fill Review column height, equal cells */}
        <div className="grid grid-cols-2 grid-rows-2 gap-md h-full min-h-0">
          <MetricTile
            label="Waiting"
            value={queue.length}
            hint={queue.length > 0 ? "Open queue" : "Caught up"}
            href="/dashboard"
            accent={queue.length > 0}
            donut={waitingDonut}
          />
          <MetricTile label="Approved" value={approved.length} hint={periodLabelText} href="/dashboard" donut={approvedDonut} />
          <MetricTile
            label="Hours"
            value={totalApprovedHours.toFixed(1)}
            hint="No prior period"
            href="/dashboard"
            donut={hoursDonut}
          />
          <MetricTile
            label="Feedback"
            value={feedbackAvg.toFixed(1)}
            hint="Average rating"
            href="/feedback"
            emojiStrip={feedbackEmojis}
          />
        </div>
      </div>

      {/* Backlog age + hours trend — how stale is the queue, then period activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
        <HorizontalBarChart
          title="How long sessions wait"
          subtitle="Under review, by age"
          data={queueAge}
          emptyLabel="No sessions waiting for review"
          index={0}
        />
        <TrendAreaChart title="Hours & submissions" subtitle={periodLabelText} data={hoursTrend} index={1} />
      </div>

      <div className="grid grid-cols-1 gap-md mt-md">
        <UsHeatmap activity={geoActivity} periodLabel={periodLabelText} isMock />
      </div>

      {/* Commerce preview — payments + orders at a glance, deeper detail on their own tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-md">
        <PaymentsPreviewCard totalCents={paymentsThisMonthCents} monthLabel="July 2026" monthly={monthly} />
        <OrdersPreviewCard
          openCount={openOrders.length}
          revenueCents={ordersRevenueCents}
          preview={orders.slice(0, 4)}
        />
      </div>

      {/* Snapshot — glanceable composition; deeper breakdowns on /insights */}
      <Bento as="section" aria-labelledby="bento-snapshot-heading" className="mt-md">
        <div className="px-lg py-lg flex flex-col sm:flex-row sm:items-center gap-lg">
          <div className="flex-1 min-w-0">
            <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">This period</p>
            <h2 id="bento-snapshot-heading" className="font-heading text-[20px] leading-[26px] text-text-primary">
              Snapshot
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-lg">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary">Approval rate</p>
              <p className="font-data text-[22px] font-semibold text-text-primary">{approvalRatePct}%</p>
            </div>
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary">Top activity</p>
              <p className="font-body text-[16px] font-medium text-text-primary truncate max-w-[10rem]">Park Cleanup</p>
            </div>
          </div>
          <Link
            href="/analytics"
            className="font-data text-[12px] font-semibold text-primary hover:underline min-h-11 inline-flex items-center gap-2 shrink-0"
          >
            More charts
            <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
          </Link>
        </div>
      </Bento>
    </div>
  );
}