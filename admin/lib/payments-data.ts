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
