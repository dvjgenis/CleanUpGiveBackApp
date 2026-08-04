/**
 * Period-scoped payments loaders — ported from `admin/lib/payments-data.ts`
 * so Payments KPIs / bars / shop breakdown follow PeriodToggle (`?period=`).
 */
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import { createDataClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/mock-data";
import {
  SHOP_ITEM_CATALOG,
  type ShopItemBreakdown,
  type ShopItemBreakdownRow,
  type ShopItemId,
} from "@/lib/shop-catalog";
import type { DashboardPeriod } from "@/lib/dashboard-period";

export { formatCents };
export type { ShopItemBreakdown, ShopItemBreakdownRow, ShopItemId };

export type BreakdownGranularity = "day" | "week" | "month" | "year";

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
  donationsFromDb: boolean;
};

/**
 * Pick chart bucket size from the page period — short windows → daily bars;
 * medium → weekly/monthly; long → yearly.
 */
export function breakdownGranularityForPeriod(
  period: DashboardPeriod,
  interval: { start: Date; end: Date } | null,
): BreakdownGranularity {
  switch (period) {
    case "day":
      return "day";
    case "month":
      return "month";
    case "year":
    case "all":
      return "year";
    case "custom": {
      if (!interval) return "week";
      const days = Math.round((interval.end.getTime() - interval.start.getTime()) / 86_400_000) + 1;
      if (days <= 14) return "day";
      if (days <= 120) return "week";
      if (days <= 400) return "month";
      return "year";
    }
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

function bucketStart(d: Date, granularity: BreakdownGranularity): Date {
  switch (granularity) {
    case "day":
      return startOfDay(d);
    case "week":
      return startOfWeek(d, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(d);
    case "year":
      return startOfYear(d);
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function bucketKey(d: Date, granularity: BreakdownGranularity): string {
  switch (granularity) {
    case "day":
      return format(d, "yyyy-MM-dd");
    case "week":
      return format(d, "yyyy-'W'II");
    case "month":
      return format(d, "yyyy-MM");
    case "year":
      return format(d, "yyyy");
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function bucketLabel(d: Date, granularity: BreakdownGranularity): string {
  switch (granularity) {
    case "day":
      return format(d, "MMM d");
    case "week":
      return `Wk of ${format(d, "MMM d")}`;
    case "month":
      return format(d, "MMM yyyy");
    case "year":
      return format(d, "yyyy");
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function nextBucket(d: Date, granularity: BreakdownGranularity): Date {
  switch (granularity) {
    case "day":
      return addDays(d, 1);
    case "week":
      return addWeeks(d, 1);
    case "month":
      return addMonths(d, 1);
    case "year":
      return addYears(d, 1);
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

/** Deterministic mock donation total for a bucket — stable across renders. */
function mockDonationCentsForBucket(d: Date, granularity: BreakdownGranularity): number {
  const dayIndex = Math.floor(d.getTime() / 86_400_000);
  const base =
    granularity === "day" ? 1_800 : granularity === "week" ? 9_800 : granularity === "month" ? 42_000 : 145_000;
  const variance = ((dayIndex % 7) - 3) * (base * 0.08);
  return Math.max(0, Math.round(base + variance));
}

const MAX_BUCKETS = 366;

/**
 * Donation + shop revenue by day/week/year across the selected interval.
 * Prefers live `donations` / `shop_orders`; mock donations only when that
 * table has no rows in the window.
 */
export async function loadPaymentsBreakdown(
  interval: { start: Date; end: Date } | null,
  granularity: BreakdownGranularity,
  now = new Date(),
): Promise<PaymentsBreakdown> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };

  let shopOrders: { total_cents: number; created_at: string }[] = [];
  let shopFromDb = false;
  let donations: { amount_cents: number; created_at: string }[] = [];
  let donationsFromDb = false;

  try {
    const supabase = await createDataClient();
    const [{ data: orderData }, { data: donationData }] = await Promise.all([
      supabase
        .from("shop_orders")
        .select("total_cents, created_at, status")
        .gte("created_at", scoped.start.toISOString())
        .lte("created_at", scoped.end.toISOString())
        .neq("status", "cancelled"),
      supabase
        .from("donations")
        .select("amount_cents, created_at, status")
        .gte("created_at", scoped.start.toISOString())
        .lte("created_at", scoped.end.toISOString())
        .eq("status", "succeeded"),
    ]);
    if (orderData) {
      shopOrders = orderData;
      shopFromDb = orderData.length > 0;
    }
    if (donationData) {
      donations = donationData;
      donationsFromDb = donationData.length > 0;
    }
  } catch {
    // Table missing or RLS — keep shop at 0 and donations on fixtures.
  }

  const buckets = new Map<string, BreakdownRow>();
  let cursor = bucketStart(scoped.start, granularity);
  let guard = 0;
  while (cursor.getTime() <= scoped.end.getTime() && guard < MAX_BUCKETS) {
    const key = bucketKey(cursor, granularity);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, granularity),
      donationsCents: donationsFromDb ? 0 : mockDonationCentsForBucket(cursor, granularity),
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

  if (donationsFromDb) {
    for (const donation of donations) {
      const start = bucketStart(parseISO(donation.created_at), granularity);
      const key = bucketKey(start, granularity);
      const existing = buckets.get(key);
      if (existing) {
        existing.donationsCents += donation.amount_cents ?? 0;
      } else {
        buckets.set(key, {
          key,
          label: bucketLabel(start, granularity),
          donationsCents: donation.amount_cents ?? 0,
          shopCents: 0,
        });
      }
    }
  }

  const rows = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  const totalDonationsCents = rows.reduce((sum, r) => sum + r.donationsCents, 0);
  const totalShopCents = rows.reduce((sum, r) => sum + r.shopCents, 0);

  return { rows, totalDonationsCents, totalShopCents, shopFromDb, donationsFromDb };
}

function resolveShopItemId(raw: { id?: unknown; name?: unknown; productId?: unknown }): ShopItemId | null {
  const idHint = String(raw.id ?? raw.productId ?? "")
    .trim()
    .toLowerCase();
  if (idHint) {
    const byId = SHOP_ITEM_CATALOG.find((p) => p.id === idHint);
    if (byId) return byId.id;
  }
  const name = String(raw.name ?? "")
    .trim()
    .toLowerCase();
  if (!name) return null;
  const byLabel = SHOP_ITEM_CATALOG.find((p) => p.label.toLowerCase() === name);
  return byLabel?.id ?? null;
}

function parseLineQty(raw: Record<string, unknown>): number {
  const qty = Number(raw.qty ?? raw.quantity ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}

function parseLineUnitCents(raw: Record<string, unknown>, fallback: number): number {
  if (typeof raw.unitCents === "number" && Number.isFinite(raw.unitCents)) {
    return Math.max(0, Math.round(raw.unitCents));
  }
  if (typeof raw.unit_cents === "number" && Number.isFinite(raw.unit_cents)) {
    return Math.max(0, Math.round(raw.unit_cents));
  }
  if (typeof raw.unitPrice === "number" && Number.isFinite(raw.unitPrice)) {
    return Math.max(0, Math.round(raw.unitPrice * 100));
  }
  if (typeof raw.price === "number" && Number.isFinite(raw.price)) {
    return raw.price >= 100 ? Math.round(raw.price) : Math.round(raw.price * 100);
  }
  return fallback;
}

function emptyItemTallies(): Record<ShopItemId, { qty: number; revenueCents: number }> {
  return Object.fromEntries(SHOP_ITEM_CATALOG.map((p) => [p.id, { qty: 0, revenueCents: 0 }])) as Record<
    ShopItemId,
    { qty: number; revenueCents: number }
  >;
}

function mockItemTallies(now: Date): Record<ShopItemId, { qty: number; revenueCents: number }> {
  const seed = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const baseQty: Record<ShopItemId, number> = {
    "cleanup-kit": 18 + (seed % 5),
    "tote-bags": 42 + (seed % 7),
    "trash-grabber": 11 + (seed % 4),
    "adult-safety-vest": 15 + (seed % 3),
    "child-safety-vest": 8 + (seed % 3),
  };
  const tallies = emptyItemTallies();
  for (const product of SHOP_ITEM_CATALOG) {
    const qty = baseQty[product.id];
    tallies[product.id] = { qty, revenueCents: qty * product.unitCents };
  }
  return tallies;
}

function accumulateItemsJson(
  items: unknown,
  tallies: Record<ShopItemId, { qty: number; revenueCents: number }>,
): boolean {
  if (!Array.isArray(items)) return false;
  let matched = false;
  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const id = resolveShopItemId(raw);
    if (!id) continue;
    const catalog = SHOP_ITEM_CATALOG.find((p) => p.id === id)!;
    const qty = parseLineQty(raw);
    if (qty <= 0) continue;
    const unitCents = parseLineUnitCents(raw, catalog.unitCents);
    tallies[id].qty += qty;
    tallies[id].revenueCents += qty * unitCents;
    matched = true;
  }
  return matched;
}

function mockPriorItemTallies(
  current: Record<ShopItemId, { qty: number; revenueCents: number }>,
): Record<ShopItemId, { qty: number; revenueCents: number }> {
  const tallies = emptyItemTallies();
  for (const product of SHOP_ITEM_CATALOG) {
    const qty = Math.max(0, current[product.id].qty - 2 - (product.id.length % 3));
    tallies[product.id] = { qty, revenueCents: qty * product.unitCents };
  }
  return tallies;
}

function finalizeItemBreakdown(
  tallies: Record<ShopItemId, { qty: number; revenueCents: number }>,
  fromDb: boolean,
  currentMonthTallies?: Record<ShopItemId, { qty: number; revenueCents: number }>,
  priorMonthTallies?: Record<ShopItemId, { qty: number; revenueCents: number }>,
): ShopItemBreakdown {
  const monthTallies = currentMonthTallies ?? tallies;
  const priorTallies = priorMonthTallies ?? emptyItemTallies();
  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].revenueCents, 0);
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + tallies[p.id].qty, 0);
  const currentMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + monthTallies[p.id].revenueCents,
    0,
  );
  const priorMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + priorTallies[p.id].revenueCents,
    0,
  );
  const unsorted: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const { qty, revenueCents } = tallies[p.id];
    const monthRevenueCents = monthTallies[p.id].revenueCents;
    const priorRevenueCents = priorTallies[p.id].revenueCents;
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
  });
  const rows = [...unsorted].sort((a, b) => {
    if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
    return b.revenueCents - a.revenueCents;
  });
  rows.forEach((row, i) => {
    row.rankByQty = i + 1;
  });
  const withSales = rows.filter((r) => r.qtySold > 0);
  return {
    rows,
    totalQty,
    totalRevenueCents,
    mostBought: withSales[0] ?? null,
    leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
    fromDb,
    currentMonthRevenueCents,
    priorMonthRevenueCents,
  };
}

/**
 * Units sold + revenue per catalog item for the selected payments window.
 * Also attaches calendar MoM tallies for the Revenue share card trend.
 * Empty live window or load failure → sample mix (`useMock: true`).
 */
export async function loadShopItemBreakdown(
  interval: { start: Date; end: Date } | null,
  now = new Date(),
): Promise<{ data: ShopItemBreakdown; useMock: boolean }> {
  const scoped = interval ?? { start: subYears(now, 1), end: now };
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const priorMonthDate = subMonths(now, 1);
  const priorMonth = { start: startOfMonth(priorMonthDate), end: endOfMonth(priorMonthDate) };
  const queryStart = scoped.start < priorMonth.start ? scoped.start : priorMonth.start;
  const queryEnd = scoped.end > thisMonth.end ? scoped.end : thisMonth.end;

  const tallies = emptyItemTallies();
  const currentMonthTallies = emptyItemTallies();
  const priorMonthTallies = emptyItemTallies();
  let matchedAny = false;

  try {
    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from("shop_orders")
      .select("items, status, created_at")
      .gte("created_at", queryStart.toISOString())
      .lte("created_at", queryEnd.toISOString())
      .neq("status", "cancelled");

    if (!error) {
      for (const order of data ?? []) {
        let createdAt: Date | null = null;
        if (typeof order.created_at === "string") {
          try {
            createdAt = parseISO(order.created_at);
          } catch {
            createdAt = null;
          }
        }
        const inScoped =
          createdAt != null && isWithinInterval(createdAt, { start: scoped.start, end: scoped.end });
        const inCurrentMonth = createdAt != null && isWithinInterval(createdAt, thisMonth);
        const inPriorMonth = createdAt != null && isWithinInterval(createdAt, priorMonth);

        if (inScoped && accumulateItemsJson(order.items, tallies)) matchedAny = true;
        if (inCurrentMonth) accumulateItemsJson(order.items, currentMonthTallies);
        if (inPriorMonth) accumulateItemsJson(order.items, priorMonthTallies);
      }
    }
  } catch {
    // Fall through to mock.
  }

  if (!matchedAny) {
    const mock = mockItemTallies(now);
    return {
      data: finalizeItemBreakdown(mock, false, mock, mockPriorItemTallies(mock)),
      useMock: true,
    };
  }
  return {
    data: finalizeItemBreakdown(tallies, true, currentMonthTallies, priorMonthTallies),
    useMock: false,
  };
}
