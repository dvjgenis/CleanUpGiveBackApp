import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { PaymentsPage } from "@/components/pages/PaymentsPage";
import { loadLiveMonthlyRevenue, loadLiveShopItemBreakdown } from "@/lib/live-data";

export default async function Payments() {
  const [{ data: monthly, useMock: monthlyIsMock }, { data: itemBreakdown, useMock: itemsAreMock }] =
    await Promise.all([loadLiveMonthlyRevenue(), loadLiveShopItemBreakdown()]);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <PaymentsPage monthly={monthly} itemBreakdown={itemBreakdown} isMock={monthlyIsMock && itemsAreMock} />
      </SidebarDemo>
    </div>
  );
}
