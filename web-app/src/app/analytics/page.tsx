import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { AnalyticsPage } from "@/components/pages/AnalyticsPage";
import { loadLiveSessions, loadLiveCourtProgress } from "@/lib/live-data";

export default async function Analytics() {
  const [{ data: sessions, useMock: sessionsAreMock }, { data: courtProgress, useMock: courtIsMock }] =
    await Promise.all([loadLiveSessions(), loadLiveCourtProgress()]);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <AnalyticsPage sessions={sessions} courtProgress={courtProgress} isMock={sessionsAreMock && courtIsMock} />
      </SidebarDemo>
    </div>
  );
}
