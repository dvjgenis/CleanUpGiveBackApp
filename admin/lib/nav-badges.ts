import { createClient } from '@/lib/supabase/server';
import { MOCK_COURT_AT_RISK, MOCK_OPEN_ORDERS, MOCK_SESSIONS } from '@/lib/dashboard-mock';

export type NavBadges = {
  sessionsUnderReview: number;
  courtAtRisk: number;
  openOrders: number;
  showPayments: boolean;
};

export async function getNavBadges(): Promise<NavBadges> {
  const supabase = await createClient();
  const [{ data: sessions }, { count: openOrdersCount }] = await Promise.all([
    supabase.from('sessions').select('status'),
    supabase
      .from('shop_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'paid', 'shipped']),
  ]);

  const useMock = !sessions || sessions.length === 0;
  const underReview = useMock
    ? MOCK_SESSIONS.filter((s) => s.status === 'under_review').length
    : sessions.filter((s) => s.status === 'under_review').length;

  const courtAtRisk = MOCK_COURT_AT_RISK.filter((v) => v.status === 'at_risk').length;
  const openOrders = useMock ? MOCK_OPEN_ORDERS : (openOrdersCount ?? 0);

  return {
    sessionsUnderReview: underReview,
    courtAtRisk,
    openOrders,
    showPayments: false, // demote until payments data exists
  };
}
