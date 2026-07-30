'use client';

import { DonutChart } from '@/components/ui/DonutChart';
import { formatCents } from '@/lib/mock-data';
import { shopItemBarColor, type ShopItemBreakdown } from '@/lib/shop-catalog';

const ITEM_TABLE_COLS = 'grid-cols-[1.6fr_5rem_6.5rem_4.5rem_5.5rem]';

export function ShopItemBreakdownSection({
  breakdown,
}: {
  breakdown: ShopItemBreakdown;
}) {
  const { rows, mostBought, leastBought, totalQty, totalRevenueCents, fromDb } = breakdown;
  const hasSales = totalQty > 0;

  const maxSharePct = hasSales ? Math.max(...rows.map((r) => r.sharePct)) : 0;

  /** Rank + order by revenue share so the highlighted top-share row is #1. */
  const tableRows = [...rows]
    .sort((a, b) => {
      if (b.sharePct !== a.sharePct) return b.sharePct - a.sharePct;
      return b.revenueCents - a.revenueCents;
    })
    .map((row, i) => ({ ...row, rankByShare: i + 1 }));

  const donutData = rows
    .filter((r) => r.revenueCents > 0)
    .map((r) => ({
      name: r.label,
      value: Math.round(r.revenueCents / 100),
      color: shopItemBarColor(r.id),
    }));

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Shop items</h2>
        <p className="font-body text-[13px] text-text-tertiary mt-xs">
          Units sold and revenue by product
          {fromDb ? ' (from shop orders)' : ' (sample mix until live line items land)'}.
        </p>
      </div>

      {hasSales && mostBought && leastBought ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="bg-bg-surface border-2 border-primary rounded-md p-md flex flex-col gap-xs">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-primary font-semibold">
              Most bought
            </p>
            <p className="font-heading text-[18px] leading-[24px] text-text-primary">
              {mostBought.label}
            </p>
            <p className="font-data text-[13px] text-text-tertiary">
              {mostBought.qtySold} units · {formatCents(mostBought.revenueCents)}
            </p>
          </div>
          <div className="bg-bg-surface border border-border-outline rounded-md p-md flex flex-col gap-xs">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary font-semibold">
              Least bought
            </p>
            <p className="font-heading text-[18px] leading-[24px] text-text-primary">
              {leastBought.label}
            </p>
            <p className="font-data text-[13px] text-text-tertiary">
              {leastBought.qtySold} units · {formatCents(leastBought.revenueCents)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-start">
        <DonutChart
          title="Revenue share"
          data={donutData}
          total={Math.round(totalRevenueCents / 100)}
          index={0}
        />

        <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
          <div
            className={`hidden lg:grid ${ITEM_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
          >
            {['Item', 'Sold', 'Revenue', 'Share', 'Rank'].map((col) => (
              <span
                key={col}
                className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                  col === 'Item' ? 'text-left' : 'text-center'
                }`}
              >
                {col}
              </span>
            ))}
          </div>
          {!hasSales ? (
            <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">
              No shop item sales in this window.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-border-outline">
              {tableRows.map((row) => {
                const isTopShare = row.sharePct === maxSharePct && maxSharePct > 0;
                return (
                  <li
                    key={row.id}
                    className={`px-md py-md first:rounded-t-md last:rounded-b-md lg:grid ${ITEM_TABLE_COLS} lg:gap-md lg:items-center lg:px-lg lg:py-sm ${
                      isTopShare
                        ? 'bg-primary/5 ring-2 ring-inset ring-primary z-[1]'
                        : ''
                    }`}
                  >
                    <div className="lg:hidden">
                      <div className="flex items-baseline justify-between gap-md">
                        <span className="min-w-0 truncate font-body text-[14px] font-medium text-text-primary">
                          {row.label}
                        </span>
                        <span className="shrink-0 font-data text-[12px] text-text-tertiary">
                          {row.qtySold} sold
                        </span>
                      </div>
                      <dl className="mt-sm grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,0.65fr)] gap-x-md">
                        <div className="min-w-0">
                          <dt className="font-data text-[10px] uppercase tracking-[0.6px] text-text-tertiary">
                            Revenue
                          </dt>
                          <dd className="mt-xs truncate font-data text-[14px] font-semibold tabular-nums text-text-primary">
                            {formatCents(row.revenueCents)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="font-data text-[10px] uppercase tracking-[0.6px] text-text-tertiary">
                            Share
                          </dt>
                          <dd
                            className={`mt-xs font-data text-[14px] tabular-nums ${
                              isTopShare ? 'font-semibold text-primary' : 'text-text-primary'
                            }`}
                          >
                            {row.sharePct}%
                          </dd>
                        </div>
                        <div className="min-w-0 text-right">
                          <dt className="font-data text-[10px] uppercase tracking-[0.6px] text-text-tertiary">
                            Rank
                          </dt>
                          <dd className="mt-xs font-data text-[14px] tabular-nums text-text-primary">
                            #{row.rankByShare}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <span className="hidden truncate font-body text-[14px] font-medium text-text-primary lg:block">
                      {row.label}
                    </span>
                    <span className="hidden whitespace-nowrap font-data text-[13px] text-text-tertiary lg:block lg:text-center">
                      {row.qtySold}
                    </span>
                    <span className="hidden whitespace-nowrap font-data text-[13px] font-semibold text-text-primary lg:block lg:text-center">
                      {formatCents(row.revenueCents)}
                    </span>
                    <span
                      className={`hidden whitespace-nowrap font-data text-[13px] lg:block lg:text-center ${
                        isTopShare ? 'font-semibold text-primary' : 'text-text-tertiary'
                      }`}
                    >
                      {row.sharePct}%
                    </span>
                    <span className="hidden whitespace-nowrap font-data text-[13px] text-text-tertiary lg:block lg:text-center">
                      #{row.rankByShare}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {hasSales ? (
            <div
              className={`px-md py-sm bg-bg-surface-elevated border-t border-border-outline lg:grid ${ITEM_TABLE_COLS} lg:gap-md lg:items-center lg:px-lg`}
            >
              <div className="flex items-center justify-between gap-md lg:hidden">
                <span className="font-body text-[13px] font-semibold text-text-primary">Total</span>
                <span className="font-data text-[12px] tabular-nums text-text-tertiary">
                  {totalQty} sold
                </span>
                <span className="font-data text-[13px] font-semibold tabular-nums text-text-primary">
                  {formatCents(totalRevenueCents)}
                </span>
                <span className="font-data text-[12px] tabular-nums text-text-tertiary">100%</span>
              </div>
              <span className="hidden font-body text-[13px] font-semibold text-text-primary lg:block">
                Total
              </span>
              <span className="hidden font-data text-[13px] font-semibold text-text-primary lg:block lg:text-center">
                {totalQty}
              </span>
              <span className="hidden font-data text-[13px] font-semibold text-text-primary lg:block lg:text-center">
                {formatCents(totalRevenueCents)}
              </span>
              <span className="hidden font-data text-[13px] text-text-tertiary lg:block lg:text-center">
                100%
              </span>
              <span className="hidden lg:block lg:text-center" aria-hidden>
                —
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
