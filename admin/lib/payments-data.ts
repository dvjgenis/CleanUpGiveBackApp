import {
  addDays,
  addWeeks,
  addYears,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfYear,
  subYears,
} from 'date-fns';
import { createDataClient } from '@/lib/supabase/server';
import {
  buildMockMonthlyRevenue,
  formatCents,
  type MonthlyRevenuePoint,
} from '@/lib/payments-mock';

export type PaymentsSummary = {
  monthLabel: string;
  donationsThisMonthCents: number;
  shopThisMonthCents: number;
  totalThisMonthCents: number;
  monthly: MonthlyRevenuePoint[];
  /** True when shop revenue this month came from `shop_orders` rows. */
  shopFromDb: boolean;
};

function monthBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

function monthLabel(now: Date) {
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Payments summary for Donna. Donations stay on fixtures until a donations
 * table exists; shop revenue prefers live `shop_orders` for the current month.
 */
export async function loadPaymentsSummary(now = new Date()): Promise<PaymentsSummary> {
  const monthly = buildMockMonthlyRevenue(now);
  const current = monthly[monthly.length - 1]!;
  const { start, end } = monthBounds(now);

  let shopThisMonthCents = current.shopCents;
  let shopFromDb = false;

  try {
    const supabase = await createDataClient();
    const { data: orders } = await supabase
      .from('shop_orders')
      .select('total_cents, status, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .neq('status', 'cancelled');

    if (orders && orders.length > 0) {
      shopThisMonthCents = orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
      shopFromDb = true;
      monthly[monthly.length - 1] = {
        ...current,
        shopCents: shopThisMonthCents,
      };
    }
  } catch {
    // Table missing or RLS — keep mock shop series.
  }

  const donationsThisMonthCents = current.donationsCents;

  return {
    monthLabel: monthLabel(now),
    donationsThisMonthCents,
    shopThisMonthCents,
    totalThisMonthCents: donationsThisMonthCents + shopThisMonthCents,
    monthly,
    shopFromDb,
  };
}

export { formatCents };

export type BreakdownGranularity = 'day' | 'week' | 'year';

/**
 * Pick chart bucket size from the page period — no Day/Week/Year UI.
 * Short windows → daily bars; medium → weekly; long → yearly.
 */
export function breakdownGranularityForPeriod(
  period: 'day' | 'month' | '30d' | 'year' | 'all' | 'custom',
  interval: { start: Date; end: Date } | null,
): BreakdownGranularity {
  switch (period) {
    case 'day':
      return 'day';
    case 'month':
    case '30d':
      return 'week';
    case 'year':
    case 'all':
      return 'year';
    case 'custom': {
      if (!interval) return 'week';
      const days =
        Math.round((interval.end.getTime() - interval.start.getTime()) / 86_400_000) + 1;
      if (days <= 14) return 'day';
      if (days <= 120) return 'week';
      return 'year';
    }
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export type BreakdownRow = {
  key: string;
  label: string;
  donationsCents: number;
  shopCents: number;
};

export type PaymentsBreakdown = {
  rows: BreakdownRow[];
  totalDonationsCents: number;
  totalShopCents: number;
  shopFromDb: boolean;
};

function bucketStart(d: Date, granularity: BreakdownGranularity): Date {
  if (granularity === 'day') return startOfDay(d);
  if (granularity === 'week') return startOfWeek(d, { weekStartsOn: 1 });
  return startOfYear(d);
}

function bucketKey(d: Date, granularity: BreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'yyyy-MM-dd');
  if (granularity === 'week') return format(d, "yyyy-'W'II");
  return format(d, 'yyyy');
}

function bucketLabel(d: Date, granularity: BreakdownGranularity): string {
  if (granularity === 'day') return format(d, 'MMM d');
  if (granularity === 'week') return `Wk of ${format(d, 'MMM d')}`;
  return format(d, 'yyyy');
}

function nextBucket(d: Date, granularity: BreakdownGranularity): Date {
  if (granularity === 'day') return addDays(d, 1);
  if (granularity === 'week') return addWeeks(d, 1);
  return addYears(d, 1);
}

/** Deterministic mock donation total for a bucket — stable across renders. */
function mockDonationCentsForBucket(d: Date, granularity: BreakdownGranularity): number {
  const dayIndex = Math.floor(d.getTime() / 86_400_000);
  const base = granularity === 'day' ? 1_800 : granularity === 'week' ? 9_800 : 145_000;
  const variance = ((dayIndex % 7) - 3) * (base * 0.08);
  return Math.max(0, Math.round(base + variance));
}

const MAX_BUCKETS = 366;

/**
 * Donation + shop revenue broken down by day, week, or year across an
 * arbitrary interval (backing the Payments datepicker). Donations stay on
 * deterministic fixtures until a donations table ships; shop revenue prefers
 * live `shop_orders` rows in range.
 */
export async function loadPaymentsBreakdown(
  interval: { start: Date; end: Date } | null,
  granularity: BreakdownGranularity,
  now = new Date(),
): Promise<PaymentsBreakdown> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };

  let shopOrders: { total_cents: number; created_at: string }[] = [];
  let shopFromDb = false;
  try {
    const supabase = await createDataClient();
    const { data } = await supabase
      .from('shop_orders')
      .select('total_cents, created_at, status')
      .gte('created_at', scoped.start.toISOString())
      .lte('created_at', scoped.end.toISOString())
      .neq('status', 'cancelled');
    if (data) {
      shopOrders = data;
      shopFromDb = data.length > 0;
    }
  } catch {
    // Table missing or RLS — keep shop series at 0 for this window.
  }

  const buckets = new Map<string, BreakdownRow>();
  let cursor = bucketStart(scoped.start, granularity);
  let guard = 0;
  while (cursor.getTime() <= scoped.end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, granularity),
      donationsCents: mockDonationCentsForBucket(cursor, granularity),
      shopCents: 0,
    });
    cursor = nextBucket(cursor, granularity);
    guard += 1;
  }

  for (const order of shopOrders) {
    const start = bucketStart(parseISO(order.created_at), granularity);
    const key = bucketKey(start, granularity);
    const existing = buckets.get(key);
    if (existing) {
      existing.shopCents += order.total_cents ?? 0;
    } else {
      buckets.set(key, {
        key,
        label: bucketLabel(start, granularity),
        donationsCents: 0,
        shopCents: order.total_cents ?? 0,
      });
    }
  }

  const rows = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  const totalDonationsCents = rows.reduce((sum, r) => sum + r.donationsCents, 0);
  const totalShopCents = rows.reduce((sum, r) => sum + r.shopCents, 0);

  return { rows, totalDonationsCents, totalShopCents, shopFromDb };
}
