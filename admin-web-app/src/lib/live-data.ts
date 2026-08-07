/**
 * Live Supabase reads for web-app pages.
 *
 * Sessions + users + court progress never fall back to fixtures: empty tables
 * / missing Auth directory return empty arrays with `useMock: false` so Vercel
 * never shows sample volunteers. Other surfaces (orders, feedback, payments,
 * revenue) still use the older empty→fixture pattern until those domains go live.
 *
 * Every table read here is the same shared Supabase project the mobile app writes to.
 */
import { endOfMonth, isWithinInterval, parseISO, startOfMonth, subMonths, subYears } from 'date-fns';
import { createDataClient, createServiceClient } from '@/lib/supabase/server';
import {
  getVolunteerDirectory,
  getVolunteerName,
  getVolunteerServiceType,
  type VolunteerDirectory,
} from '@/lib/volunteers';
import {
  MOCK_FEEDBACK,
  MOCK_ORDERS,
  buildMockMonthlyRevenue,
  normalizeOrderStatus,
  type MockSession,
  type FeedbackEntry,
  type OrderLineItem,
  type OrderRow,
  type MockCourtVolunteer,
  type MonthlyRevenuePoint,
  type ShippingAddress,
} from '@/lib/mock-data';
import {
  SHOP_ITEM_CATALOG,
  buildMockShopItemBreakdown,
  type ShopItemBreakdown,
  type ShopItemBreakdownRow,
  type ShopItemId,
} from '@/lib/shop-catalog';
import { withEventTiming, type EventListItem, type EventRow } from '@/lib/events';
import { buildCourtRisk, type CourtOrderRow as CourtRiskOrderRow } from '@/lib/court-risk';
import { geoFipsForPoint } from '@/lib/us-geo';
import { ILLINOIS_FIPS } from '@/lib/us-heatmap';

export type LiveResult<T> = { data: T; useMock: boolean };

/**
 * Sessions scoped for Dashboard/Sessions pages — real `sessions` rows enriched with Auth names.
 * Excludes `active` (in-progress, not yet submitted) sessions: admin must never see a
 * volunteer's location/activity while a session is still live, only after they submit it.
 */
export async function loadLiveSessions(): Promise<LiveResult<MockSession[]>> {
  const supabase = await createDataClient();
  const [{ data: rows, error }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        'id, user_id, activity, started_at, ended_at, created_at, status, duration_seconds, adjusted_hours, court_ordered, distance_miles, route',
      )
      .neq('status', 'active')
      .order('created_at', { ascending: false }),
    getVolunteerDirectory(),
  ]);

  // Query failures must not fall through to fixtures — that looks "loaded" with
  // fake volunteers while production is broken. Empty table stays empty (real mode).
  if (error) {
    throw new Error(`Failed to load sessions from Supabase: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
    return { data: [], useMock: false };
  }

  // Route (GPS trail) is preferred; checkpoint selfie/progress pins are the
  // fallback for sessions logged before route capture or with a sparse route.
  const sessionIds = rows.map((s) => s.id);
  const { data: checkpointRows } = await supabase
    .from('checkpoints')
    .select('session_id, latitude, longitude')
    .in('session_id', sessionIds)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const checkpointBySession = new Map<string, { latitude: number; longitude: number }>();
  for (const c of checkpointRows ?? []) {
    if (c.latitude == null || c.longitude == null || checkpointBySession.has(c.session_id)) continue;
    checkpointBySession.set(c.session_id, { latitude: c.latitude, longitude: c.longitude });
  }

  const sessions: MockSession[] = await Promise.all(
    rows.map(async (s) => {
      const point = firstRoutePoint(s.route) ?? checkpointBySession.get(s.id) ?? null;
      const { stateFips, countyFips } = point
        ? await geoFipsForPoint(point.longitude, point.latitude)
        : { stateFips: null, countyFips: null };

      return {
        id: s.id,
        user_id: s.user_id,
        volunteer_name: getVolunteerName(directory, s.user_id),
        volunteer_service_type: getVolunteerServiceType(directory, s.user_id),
        activity: s.activity,
        status: (s.status ?? 'under_review') as MockSession['status'],
        duration_seconds: s.duration_seconds,
        adjusted_hours: s.adjusted_hours,
        court_ordered: Boolean(s.court_ordered),
        distance_miles: s.distance_miles,
        started_at: s.started_at ?? s.created_at,
        ended_at: s.ended_at ?? s.started_at ?? s.created_at,
        created_at: s.created_at ?? s.started_at ?? new Date().toISOString(),
        // Geocoded from the session's GPS route (or a checkpoint pin) via point-in-polygon
        // against the states/counties map; sessions with no GPS data fall back to the IL placeholder.
        state_fips: stateFips ?? ILLINOIS_FIPS,
        state_fips_placeholder: stateFips == null,
        county_fips: countyFips,
      };
    }),
  );

  return { data: sessions, useMock: false };
}

/** First finite `[longitude, latitude]` pair in a session's route jsonb, if any. */
function firstRoutePoint(route: unknown): { longitude: number; latitude: number } | null {
  if (!Array.isArray(route)) return null;
  for (const point of route) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const [longitude, latitude] = point;
    if (typeof longitude === 'number' && typeof latitude === 'number' && Number.isFinite(longitude) && Number.isFinite(latitude)) {
      return { longitude, latitude };
    }
  }
  return null;
}

type FeedbackRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  rating: string | null;
  comment: string | null;
  flagged: boolean | null;
  submitted_at: string;
};

/** Feedback scoped for the Feedback page — real `volunteer_feedback` rows enriched with names + activity. */
export async function loadLiveFeedback(): Promise<LiveResult<FeedbackEntry[]>> {
  const supabase = await createDataClient();
  const { data: rows } = await supabase
    .from('volunteer_feedback')
    .select('id, user_id, session_id, rating, comment, flagged, submitted_at')
    .order('submitted_at', { ascending: false });

  if (!rows || rows.length === 0) {
    return { data: MOCK_FEEDBACK, useMock: true };
  }

  const feedbackRows = rows as FeedbackRow[];
  const sessionIds = [...new Set(feedbackRows.map((f) => f.session_id).filter((id): id is string => Boolean(id)))];
  const [directory, { data: sessions }] = await Promise.all([
    getVolunteerDirectory(),
    sessionIds.length > 0
      ? supabase.from('sessions').select('id, activity').in('id', sessionIds)
      : Promise.resolve({ data: [] as { id: string; activity: string | null }[] }),
  ]);
  const activityById = new Map((sessions ?? []).map((s) => [s.id, s.activity]));

  const feedback: FeedbackEntry[] = feedbackRows.map((f) => ({
    id: f.id,
    volunteer: f.user_id ? getVolunteerName(directory, f.user_id) : 'Unknown volunteer',
    rating: (f.rating ?? 'neutral') as FeedbackEntry['rating'],
    comment: f.comment,
    submittedAt: f.submitted_at,
    activity: (f.session_id ? activityById.get(f.session_id) : null) ?? 'Cleanup',
    flagged: f.flagged ?? false,
  }));

  return { data: feedback, useMock: false };
}

type ShopOrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  total_cents: number | null;
  status: string | null;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
};

function describeItems(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as Record<string, unknown>;
      const name = String(raw.name ?? raw.id ?? raw.productId ?? 'Item');
      const qty = Number(raw.qty ?? raw.quantity ?? 1) || 1;
      return `${name} × ${qty}`;
    })
    .filter(Boolean)
    .join(', ');
}

/** Shop orders for Orders + dashboard preview — real `shop_orders` rows. */
export async function loadLiveOrders(): Promise<LiveResult<OrderRow[]>> {
  const supabase = await createDataClient();
  const { data: rows } = await supabase
    .from('shop_orders')
    .select('id, user_id, items, total_cents, status, created_at')
    .order('created_at', { ascending: false });

  if (!rows || rows.length === 0) {
    return { data: MOCK_ORDERS, useMock: true };
  }

  const directory = await getVolunteerDirectory();
  const orderRows = rows as ShopOrderRow[];
  const orders: OrderRow[] = orderRows.map((o) => transformOrderRow(o, directory));

  return { data: orders, useMock: false };
}

type VolunteerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  joinedAt: string | null;
  lastActive: string | null;
  courtOrdered: boolean;
  requiredHours: number | null;
  courtDueDate: string | null;
  caseReference: string | null;
  sessions: Array<{
    id: string;
    activity: string | null;
    started_at: string | null;
    duration_seconds: number | null;
    adjusted_hours: number | null;
    distance_miles: number | null;
    status: string;
    court_ordered: boolean;
  }>;
};

/** Load a single volunteer profile with detailed information including sessions and court orders */
export async function loadLiveVolunteerById(id: string): Promise<LiveResult<VolunteerDetail | null>> {
  const supabase = await createDataClient();
  const serviceClient = await createServiceClient();

  // Try to get the user from Auth
  try {
    const { data: userResponse, error: userError } = await serviceClient.auth.admin.getUserById(id);
    if (userError || !userResponse?.user) {
      return { data: null, useMock: false };
    }

    const user = userResponse.user;
    const meta = user.user_metadata ?? {};
    const name = meta.name || user.email?.split('@')[0] || 'Unknown';
    const phone = user.phone ?? (typeof meta.phone === 'string' ? meta.phone : null);

    // Get sessions and court orders
    const [{ data: sessions }, { data: courtOrders }] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, activity, started_at, duration_seconds, adjusted_hours, distance_miles, status, court_ordered')
        .eq('user_id', id)
        .neq('status', 'active')
        .order('started_at', { ascending: false }),
      supabase
        .from('court_orders')
        .select('required_hours, due_date, case_reference, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ]);

    const sessionRows = sessions ?? [];
    const courtOrderList = courtOrders ?? [];
    const courtOrder = courtOrderList[0] ?? null;
    const courtOrdered = courtOrderList.length > 0;

    return {
      data: {
        id: user.id,
        name,
        email: user.email || '—',
        phone,
        joinedAt: user.created_at,
        lastActive: user.last_sign_in_at ?? null,
        courtOrdered,
        requiredHours: courtOrder?.required_hours ?? null,
        courtDueDate: courtOrder?.due_date ?? null,
        caseReference: courtOrder?.case_reference ?? null,
        sessions: sessionRows,
      },
      useMock: false
    };
  } catch {
    return { data: null, useMock: false };
  }
}

/** Load a single order by ID with full details including shipping, tracking, and line items */
export async function loadLiveOrderById(id: string): Promise<LiveResult<OrderRow | null>> {
  const supabase = await createDataClient();
  const { data: row } = await supabase
    .from('shop_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!row) {
    const mockOrder = MOCK_ORDERS.find(o => o.id === id);
    return { data: mockOrder || null, useMock: true };
  }

  const directory = await getVolunteerDirectory();
  const order = transformOrderRow(row as any, directory);

  return { data: order, useMock: false };
}

function transformOrderRow(o: ShopOrderRow, directory: VolunteerDirectory): OrderRow {
  const entry = o.user_id ? directory.get(o.user_id) : undefined;
  
  // Parse shipping address from jsonb
  const shipping = parseShippingAddress(o.shipping_address, entry?.name || 'Unknown volunteer');
  
  // Parse line items from jsonb
  const lineItems = parseLineItems(o.items);

  return {
    id: o.id,
    volunteer: entry?.name ?? (o.user_id ? getVolunteerName(directory, o.user_id) : 'Unknown volunteer'),
    email: entry?.email ?? '—',
    items: describeItems(o.items),
    lineItems,
    totalCents: o.total_cents ?? 0,
    status: normalizeOrderStatus(o.status ?? 'pending'),
    tracking: o.tracking_number || null,
    carrier: o.carrier || null,
    shipping,
    createdAt: o.created_at,
  };
}

function parseShippingAddress(shippingData: any, fallbackName: string): ShippingAddress {
  if (!shippingData || typeof shippingData !== 'object') {
    return {
      name: fallbackName,
      line1: 'Address not provided',
      city: '—',
      state: '—',
      postalCode: '—',
      country: 'US',
    };
  }

  return {
    name: shippingData.name || fallbackName,
    line1: shippingData.line1 || shippingData.address || 'Address not provided',
    line2: shippingData.line2 || null,
    city: shippingData.city || '—',
    state: shippingData.state || '—',
    postalCode: shippingData.postalCode || shippingData.postal_code || shippingData.zip || '—',
    country: shippingData.country || 'US',
    phone: shippingData.phone || null,
  };
}

function parseLineItems(itemsData: any): OrderLineItem[] {
  if (!Array.isArray(itemsData)) return [];
  
  return itemsData
    .map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      
      return {
        name: String(item.name || item.id || item.productId || 'Item'),
        qty: Number(item.qty || item.quantity || 1) || 1,
        unitCents: Number(item.unitCents || item.unit_cents || item.price || 0),
      };
    })
    .filter(Boolean) as OrderLineItem[];
}

type CourtOrderRow = { user_id: string; required_hours: number; due_date: string | null };

function computedHours(seconds: number | null, adjustedHours: number | null): number {
  if (adjustedHours != null) return adjustedHours;
  if (!seconds) return 0;
  return seconds / 3600;
}

/**
 * Court-ordered volunteer progress for the Insights/Analytics "Court progress"
 * chart — real `court_orders` + `sessions`, run through the same `buildCourtRisk`
 * used for the Events "notify at-risk volunteers" feature.
 */
export async function loadLiveCourtProgress(): Promise<LiveResult<MockCourtVolunteer[]>> {
  const supabase = await createDataClient();
  const { data: courtOrders } = await supabase.from('court_orders').select('user_id, required_hours, due_date');

  if (!courtOrders || courtOrders.length === 0) {
    return { data: [], useMock: false };
  }

  const orderRows = courtOrders as CourtRiskOrderRow[];
  const [{ data: sessions }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select('user_id, status, court_ordered, duration_seconds, adjusted_hours')
      .neq('status', 'active')
      .in(
        'user_id',
        orderRows.map((c) => c.user_id),
      ),
    getVolunteerDirectory(),
  ]);

  const sessionRows = (sessions ?? []) as {
    user_id: string;
    status: string;
    court_ordered: boolean;
    duration_seconds: number | null;
    adjusted_hours: number | null;
  }[];
  const sessionCountByUser = new Map<string, number>();
  for (const s of sessionRows) {
    sessionCountByUser.set(s.user_id, (sessionCountByUser.get(s.user_id) ?? 0) + 1);
  }

  const risk = buildCourtRisk(orderRows, sessionRows, directory, new Date());
  const volunteers: MockCourtVolunteer[] = risk.map((r) => ({
    id: r.id,
    name: r.name,
    email: directory.get(r.id)?.email ?? '—',
    requiredHours: r.requiredHours,
    completedHours: r.completedHours,
    sessions: sessionCountByUser.get(r.id) ?? 0,
    status: r.status,
    dueDate: r.dueDate || new Date().toISOString().slice(0, 10),
  }));

  return { data: volunteers, useMock: false };
}

/**
 * Live shop + donation revenue merged into the mock series for the current
 * month — same "prefer live, fall back per-source" split as
 * `admin/lib/payments-data.ts`. No writer for `donations` yet (mobile Donate
 * flow is still local/mock until Stripe ships) — see `admin/db/006_donations.sql`.
 */
export async function loadLiveMonthlyRevenue(now = new Date()): Promise<LiveResult<MonthlyRevenuePoint[]>> {
  const monthly = buildMockMonthlyRevenue(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const supabase = await createDataClient();
  const [{ data: orders }, { data: donations }] = await Promise.all([
    supabase
      .from('shop_orders')
      .select('total_cents, status, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .neq('status', 'cancelled'),
    supabase
      .from('donations')
      .select('amount_cents, status, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .eq('status', 'succeeded'),
  ]);

  const shopFromDb = Boolean(orders && orders.length > 0);
  const donationsFromDb = Boolean(donations && donations.length > 0);
  if (!shopFromDb && !donationsFromDb) {
    return { data: monthly, useMock: true };
  }

  const current = monthly[monthly.length - 1];
  monthly[monthly.length - 1] = {
    ...current,
    shopCents: shopFromDb ? orders!.reduce((sum, o) => sum + (o.total_cents ?? 0), 0) : current.shopCents,
    donationsCents: donationsFromDb
      ? donations!.reduce((sum, d) => sum + (d.amount_cents ?? 0), 0)
      : current.donationsCents,
  };
  return { data: monthly, useMock: false };
}

function resolveShopItemId(raw: { id?: unknown; name?: unknown; productId?: unknown }): ShopItemId | null {
  const idHint = String(raw.id ?? raw.productId ?? '').trim().toLowerCase();
  const byId = SHOP_ITEM_CATALOG.find((p) => p.id === idHint);
  if (byId) return byId.id;
  const name = String(raw.name ?? '').trim().toLowerCase();
  const byLabel = SHOP_ITEM_CATALOG.find((p) => p.label.toLowerCase() === name);
  return byLabel?.id ?? null;
}

function emptyItemTallies(): Record<ShopItemId, { qty: number; revenueCents: number }> {
  return Object.fromEntries(SHOP_ITEM_CATALOG.map((p) => [p.id, { qty: 0, revenueCents: 0 }])) as Record<
    ShopItemId,
    { qty: number; revenueCents: number }
  >;
}

/** Units sold + revenue per catalog item for the Payments breakdown — real `shop_orders.items`. */
export async function loadLiveShopItemBreakdown(now = new Date()): Promise<LiveResult<ShopItemBreakdown>> {
  const supabase = await createDataClient();
  const { data } = await supabase
    .from('shop_orders')
    .select('items, status, created_at')
    .gte('created_at', subYears(now, 1).toISOString())
    .neq('status', 'cancelled');

  const tallies = emptyItemTallies();
  const currentMonthTallies = emptyItemTallies();
  const priorMonthTallies = emptyItemTallies();
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const priorMonthDate = subMonths(now, 1);
  const priorMonth = { start: startOfMonth(priorMonthDate), end: endOfMonth(priorMonthDate) };
  let matchedAny = false;

  for (const order of data ?? []) {
    const items = order.items;
    if (!Array.isArray(items)) continue;

    let createdAt: Date | null = null;
    if (typeof order.created_at === 'string') {
      try {
        createdAt = parseISO(order.created_at);
      } catch {
        createdAt = null;
      }
    }
    const inCurrentMonth = createdAt != null && isWithinInterval(createdAt, thisMonth);
    const inPriorMonth = createdAt != null && isWithinInterval(createdAt, priorMonth);

    for (const entry of items) {
      if (!entry || typeof entry !== 'object') continue;
      const raw = entry as Record<string, unknown>;
      const id = resolveShopItemId(raw);
      if (!id) continue;
      const qty = Number(raw.qty ?? raw.quantity ?? 0);
      if (!(qty > 0)) continue;
      const catalog = SHOP_ITEM_CATALOG.find((p) => p.id === id)!;
      const unitCents = Number(raw.unitCents ?? raw.unit_cents ?? catalog.unitCents) || catalog.unitCents;
      const lineCents = qty * unitCents;
      tallies[id].qty += qty;
      tallies[id].revenueCents += lineCents;
      if (inCurrentMonth) {
        currentMonthTallies[id].qty += qty;
        currentMonthTallies[id].revenueCents += lineCents;
      }
      if (inPriorMonth) {
        priorMonthTallies[id].qty += qty;
        priorMonthTallies[id].revenueCents += lineCents;
      }
      matchedAny = true;
    }
  }

  if (!matchedAny) {
    return { data: buildMockShopItemBreakdown(now), useMock: true };
  }

  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].revenueCents, 0);
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].qty, 0);
  const currentMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + currentMonthTallies[p.id].revenueCents,
    0,
  );
  const priorMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + priorMonthTallies[p.id].revenueCents,
    0,
  );
  const rows: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const { qty, revenueCents } = tallies[p.id];
    const monthRevenueCents = currentMonthTallies[p.id].revenueCents;
    const priorRevenueCents = priorMonthTallies[p.id].revenueCents;
    return {
      id: p.id,
      label: p.label,
      unitCents: p.unitCents,
      qtySold: qty,
      revenueCents,
      sharePct: totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 100) : 0,
      rankByQty: 0,
      currentMonthRevenueCents: monthRevenueCents,
      currentMonthSharePct:
        currentMonthRevenueCents > 0
          ? Math.round((monthRevenueCents / currentMonthRevenueCents) * 100)
          : currentMonthRevenueCents === 0 && priorMonthRevenueCents === 0
            ? null
            : 0,
      priorRevenueCents,
      priorSharePct:
        priorMonthRevenueCents > 0
          ? Math.round((priorRevenueCents / priorMonthRevenueCents) * 100)
          : priorMonthRevenueCents === 0 && currentMonthRevenueCents === 0
            ? null
            : 0,
    };
  }).sort((a, b) => (b.qtySold !== a.qtySold ? b.qtySold - a.qtySold : b.revenueCents - a.revenueCents));
  rows.forEach((row, i) => {
    row.rankByQty = i + 1;
  });
  const withSales = rows.filter((r) => r.qtySold > 0);

  return {
    data: {
      rows,
      totalQty,
      totalRevenueCents,
      mostBought: withSales[0] ?? null,
      leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
      fromDb: true,
      currentMonthRevenueCents,
      priorMonthRevenueCents,
    },
    useMock: false,
  };
}

type SessionForUser = { user_id: string; status: string | null; duration_seconds: number | null; adjusted_hours: number | null };

/**
 * Full Users/Volunteers directory for `/users` + `/volunteers` — every Auth
 * user with session-derived hours, court-ordered ones flagged from
 * `court_orders`. Empty Auth directory (missing service-role key or no users)
 * returns `[]` in real mode — never the illustrative mock roster.
 */
export async function loadLiveUsers(): Promise<LiveResult<import('@/components/ui/UserPreviewDrawer').UserRow[]>> {
  const directory = await getVolunteerDirectory();
  if (directory.size === 0) {
    return { data: [], useMock: false };
  }

  const supabase = await createDataClient();
  const [{ data: sessions }, { data: courtOrders }] = await Promise.all([
    supabase.from('sessions').select('user_id, status, duration_seconds, adjusted_hours').neq('status', 'active'),
    supabase.from('court_orders').select('user_id, required_hours, due_date'),
  ]);

  const courtByUser = new Map((courtOrders as CourtOrderRow[] | null ?? []).map((c) => [c.user_id, c]));
  const sessionsByUser = new Map<string, SessionForUser[]>();
  for (const s of (sessions as SessionForUser[] | null) ?? []) {
    const list = sessionsByUser.get(s.user_id) ?? [];
    list.push(s);
    sessionsByUser.set(s.user_id, list);
  }

  const users = [...directory.values()].map((entry) => {
    const userSessions = sessionsByUser.get(entry.id) ?? [];
    const approvedHours = userSessions
      .filter((s) => s.status === 'approved')
      .reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);
    const courtOrder = courtByUser.get(entry.id);

    return {
      id: entry.id,
      name: entry.name,
      email: entry.email ?? '—',
      phone: null,
      sessions: userSessions.length,
      totalHours: approvedHours,
      courtOrdered: Boolean(courtOrder),
      lastActive: null,
      joinedAt: entry.createdAt,
      requiredHours: courtOrder?.required_hours ?? null,
      completedHours: courtOrder ? approvedHours : null,
    };
  });

  return { data: users, useMock: false };
}

/** Events for `/events` — real `events` table rows, same one the mobile app reads. */
export async function loadLiveEvents(): Promise<LiveResult<EventListItem[]>> {
  const supabase = await createDataClient();
  const { data } = await supabase.from('events').select('*').order('starts_at', { ascending: true });
  const rows = (data ?? []) as EventRow[];
  return { data: rows.map((r) => withEventTiming(r)), useMock: rows.length === 0 };
}

/** Single event for `/events/[id]` — real `events` row by id. */
export async function loadLiveEvent(id: string): Promise<EventListItem | null> {
  const supabase = await createDataClient();
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  return data ? withEventTiming(data as EventRow) : null;
}

export type { VolunteerDirectory };
