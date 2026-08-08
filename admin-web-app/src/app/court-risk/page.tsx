import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { CourtRiskDashboardPage } from "@/components/pages/CourtRiskDashboardPage";
import { loadCourtRiskDashboard } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function CourtRisk() {
  const { data: rows } = await loadCourtRiskDashboard();

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <CourtRiskDashboardPage rows={rows} />
      </SidebarDemo>
    </div>
  );
}
