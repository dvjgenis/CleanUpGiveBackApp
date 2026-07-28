import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { MOCK_COURT_HOURS, MOCK_OPEN_ORDERS, MOCK_SESSIONS } from '@/lib/dashboard-mock';
import { getVolunteerDirectory, type VolunteerDirectory } from '@/lib/volunteers';
import { buildCourtRisk } from '@/lib/court-risk';
import type { CourtOrder } from '@/types/database';

export type NavBadges = {
  sessionsUnderReview: number;
  courtAtRisk: number;
  openOrders: number;
};

export async function getNavBadges(): Promise<NavBadges> {
  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  const [{ data: sessions }, { count: openOrdersCount }, { data: courtOrders }] = await Promise.all([
    supabase.from('sessions').select('user_id, status, court_ordered, duration_seconds, adjusted_hours'),
    supabase
      .from('shop_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'paid', 'shipped']),
    supabase.from('court_orders').select('*'),
  ]);

  const directory: VolunteerDirectory = serviceClient
    ? await getVolunteerDirectory(serviceClient)
    : new Map();

  const useMockSessions = !sessions || sessions.length === 0;
  const underReview = useMockSessions
    ? MOCK_SESSIONS.filter((s) => s.status === 'under_review').length
    : sessions.filter((s) => s.status === 'under_review').length;

  const useMockCourt = !courtOrders || courtOrders.length === 0;
  const courtAtRisk = useMockCourt
    ? MOCK_COURT_HOURS.filter((v) => v.status === 'at_risk').length
    : buildCourtRisk((courtOrders ?? []) as CourtOrder[], sessions ?? [], directory, new Date()).filter(
        (v) => v.status === 'at_risk',
      ).length;

  const openOrders = useMockSessions ? MOCK_OPEN_ORDERS : (openOrdersCount ?? 0);

  return {
    sessionsUnderReview: underReview,
    courtAtRisk,
    openOrders,
  };
}
