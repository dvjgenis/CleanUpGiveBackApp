/** Canonical shop catalog — matches mobile `/shop` pricing. */

export const SHOP_ITEM_CATALOG = [
  { id: 'cleanup-kit', label: 'Trash Cleanup Kit', chartLabel: 'Kit', unitCents: 2999 },
  { id: 'tote-bags', label: 'Tote Bags', chartLabel: 'Tote', unitCents: 300 },
  { id: 'trash-grabber', label: 'Trash Grabber', chartLabel: 'Grabber', unitCents: 2399 },
  { id: 'adult-safety-vest', label: 'Adult Safety Vest', chartLabel: 'Adult vest', unitCents: 1299 },
  { id: 'child-safety-vest', label: 'Child Safety Vest', chartLabel: 'Child vest', unitCents: 999 },
] as const;

export type ShopItemId = (typeof SHOP_ITEM_CATALOG)[number]['id'];

export type ShopItemBreakdownRow = {
  id: ShopItemId;
  label: string;
  unitCents: number;
  qtySold: number;
  revenueCents: number;
  sharePct: number;
  rankByQty: number;
};

export type ShopItemBreakdown = {
  rows: ShopItemBreakdownRow[];
  totalQty: number;
  totalRevenueCents: number;
  mostBought: ShopItemBreakdownRow | null;
  leastBought: ShopItemBreakdownRow | null;
  fromDb: boolean;
};

const ITEM_BAR_COLORS: Record<ShopItemId, string> = {
  'cleanup-kit': '#007536',
  'tote-bags': '#2F80ED',
  'trash-grabber': '#fcab29',
  'adult-safety-vest': '#1565c0',
  'child-safety-vest': '#4a9e6e',
};

export function shopItemBarColor(id: ShopItemId): string {
  return ITEM_BAR_COLORS[id];
}

/** Deterministic mock sales mix for Payments shop-item breakdown. */
export function buildMockShopItemBreakdown(now = new Date()): ShopItemBreakdown {
  const seed = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const baseQty: Record<ShopItemId, number> = {
    'cleanup-kit': 18 + (seed % 5),
    'tote-bags': 42 + (seed % 7),
    'trash-grabber': 11 + (seed % 4),
    'adult-safety-vest': 15 + (seed % 3),
    'child-safety-vest': 8 + (seed % 3),
  };

  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + baseQty[p.id] * p.unitCents,
    0,
  );
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + baseQty[p.id], 0);

  const rows: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const qtySold = baseQty[p.id];
    const revenueCents = qtySold * p.unitCents;
    return {
      id: p.id,
      label: p.label,
      unitCents: p.unitCents,
      qtySold,
      revenueCents,
      sharePct: totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 100) : 0,
      rankByQty: 0,
    };
  }).sort((a, b) => {
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
    fromDb: false,
  };
}
