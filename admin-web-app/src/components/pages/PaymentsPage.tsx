"use client";

/**
 * Faithful port of `admin/app/(admin)/payments/page.tsx` + `PaymentsBreakdownSection.tsx`.
 * All / Donations / Shop filters the period bar chart; product breakdown sits below.
 *
 * `monthly`/`itemBreakdown` are fetched live from the shared Supabase
 * `shop_orders` table by `admin-web-app/src/app/payments/page.tsx` (see
 * `@/lib/live-data`) — donations stay mock until a donations table ships,
 * matching `admin/lib/payments-data.ts`.
 */
import { Suspense, useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { RevenueBarChart } from "@/components/ui/RevenueBarChart";
import { ShopItemBreakdownSection } from "@/components/ui/ShopItemBreakdownSection";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { usePeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { buildMockMonthlyRevenue, formatCents, type MonthlyRevenuePoint } from "@/lib/mock-data";
import { buildMockShopItemBreakdown, type ShopItemBreakdown } from "@/lib/shop-catalog";

type TypeFilter = "all" | "donations" | "shop";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "donations", label: "Donations" },
  { value: "shop", label: "Shop" },
];

const PAYMENTS_TABLE_COLS = "lg:grid-cols-[1.4fr_6.5rem_6.5rem_6.5rem]";

export function PaymentsPage({
  monthly = buildMockMonthlyRevenue(),
  itemBreakdown = buildMockShopItemBreakdown(),
  isMock = false,
}: {
  monthly?: MonthlyRevenuePoint[];
  itemBreakdown?: ShopItemBreakdown;
  isMock?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <PaymentsPageInner monthly={monthly} itemBreakdown={itemBreakdown} isMock={isMock} />
    </Suspense>
  );
}

function PaymentsPageInner({
  monthly,
  itemBreakdown,
  isMock,
}: {
  monthly: MonthlyRevenuePoint[];
  itemBreakdown: ShopItemBreakdown;
  isMock: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const selection = usePeriodSelection();
  const rangeLabel = usePeriodLabel();

  const totalDonationsCents = monthly.reduce((sum, m) => sum + m.donationsCents, 0);
  const totalShopCents = monthly.reduce((sum, m) => sum + m.shopCents, 0);
  const totalCents = totalDonationsCents + totalShopCents;

  const chartData = monthly.map((m) => ({
    label: m.label,
    monthKey: m.monthKey,
    donationsCents: typeFilter === "shop" ? 0 : m.donationsCents,
    shopCents: typeFilter === "donations" ? 0 : m.shopCents,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <div>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Payments</h1>
          <p className="mt-xs font-body text-[14px] text-text-tertiary">
            Donation and shop revenue for {rangeLabel}. Refunds and disputes stay in Stripe.
          </p>
        </div>
        <PeriodToggle selection={selection} />
      </header>

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        <KPICard label="Donations" value={formatCents(totalDonationsCents)} subtext={rangeLabel} index={0} />
        <KPICard
          label="Shop revenue"
          value={formatCents(totalShopCents)}
          subtext="Merchandise + kits"
          index={1}
          href="/orders"
          showChevron
        />
        <KPICard label="Total" value={formatCents(totalCents)} subtext="Donations + shop" index={2} />
      </div>

      <div className="flex flex-col gap-md mb-xl">
        <div
          className="flex items-center gap-xs w-full min-w-0 overflow-x-auto"
          role="group"
          aria-label="Filter by revenue type"
        >
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                typeFilter === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <RevenueBarChart
          title="Revenue breakdown"
          subtitle="Totals for the last 6 months"
          data={chartData}
          index={0}
        />

        <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
          <div
            className={`hidden lg:grid ${PAYMENTS_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
          >
            {["Period", "Donations", "Shop", "Total"].map((col) => (
              <span
                key={col}
                className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                  col === "Period" ? "text-left" : "text-center"
                }`}
              >
                {col}
              </span>
            ))}
          </div>
          <ul role="list" className="divide-y divide-border-outline max-h-[420px] overflow-y-auto">
            {[...monthly].reverse().map((row) => {
              const donationsDisplay = typeFilter === "shop" ? "—" : formatCents(row.donationsCents);
              const shopDisplay = typeFilter === "donations" ? "—" : formatCents(row.shopCents);
              const periodTotal = formatCents(
                (typeFilter === "shop" ? 0 : row.donationsCents) +
                  (typeFilter === "donations" ? 0 : row.shopCents),
              );
              return (
                <li
                  key={row.monthKey}
                  className={`grid grid-cols-1 ${PAYMENTS_TABLE_COLS} gap-xs lg:gap-md lg:items-center px-lg py-md lg:py-sm`}
                >
                  <span className="font-body text-[14px] font-medium text-text-primary">{row.label}</span>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Donations </span>
                    {donationsDisplay}
                  </span>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Shop </span>
                    {shopDisplay}
                  </span>
                  <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70 font-normal">Total </span>
                    {periodTotal}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mb-xl">
        <ShopItemBreakdownSection breakdown={itemBreakdown} />
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Manage refunds, disputes, and payout details in Stripe. Full in-app Stripe tools ship in v2.
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center justify-center gap-sm shrink-0 w-full sm:w-auto"
        >
          Manage in Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
    </div>
  );
}
