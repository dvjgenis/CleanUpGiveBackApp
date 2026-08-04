import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { PaymentsPage } from "@/components/pages/PaymentsPage";
import {
  breakdownGranularityForPeriod,
  loadPaymentsBreakdown,
  loadShopItemBreakdown,
} from "@/lib/payments-data";
import { parsePeriodSelection, paymentsPeriodInterval } from "@/lib/dashboard-period";

export default async function Payments({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const selection = parsePeriodSelection(params);
  const now = new Date();
  const interval = paymentsPeriodInterval(selection, now);
  const granularity = breakdownGranularityForPeriod(selection.period, interval);

  const [breakdown, itemsResult] = await Promise.all([
    loadPaymentsBreakdown(interval, granularity, now),
    loadShopItemBreakdown(interval, now),
  ]);

  const isMock = (!breakdown.shopFromDb && !breakdown.donationsFromDb) || itemsResult.useMock;

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <PaymentsPage
          rows={breakdown.rows}
          totalDonationsCents={breakdown.totalDonationsCents}
          totalShopCents={breakdown.totalShopCents}
          itemBreakdown={itemsResult.data}
          donationsFromDb={breakdown.donationsFromDb}
          shopFromDb={breakdown.shopFromDb}
          isMock={isMock}
        />
      </SidebarDemo>
    </div>
  );
}
