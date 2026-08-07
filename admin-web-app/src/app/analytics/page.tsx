import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { AnalyticsPage } from "@/components/pages/AnalyticsPage";
import { loadLiveSessions, loadLiveCourtProgress } from "@/lib/live-data";
import { resolveInsightsFixtures } from "@/lib/mock-data";
import { parsePeriodSelection, periodInterval } from "@/lib/dashboard-period";

export default async function Analytics({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const selection = parsePeriodSelection(params);
  const interval = periodInterval(selection, now);

  const [{ data: liveSessions }, { data: liveCourt }] = await Promise.all([
    loadLiveSessions(),
    loadLiveCourtProgress(),
  ]);
  const { sessions, courtProgress, isMock } = resolveInsightsFixtures(
    liveSessions,
    liveCourt,
    now,
    interval,
  );

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <AnalyticsPage
          sessions={sessions}
          realSessions={liveSessions}
          courtProgress={courtProgress}
          isMock={isMock}
        />
      </SidebarDemo>
    </div>
  );
}
