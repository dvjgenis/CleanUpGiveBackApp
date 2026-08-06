import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { SessionsPage } from "@/components/pages/SessionsPage";
import { loadLiveSessions } from "@/lib/live-data";

// Without this, Next prerenders this route as static at build time (no
// dynamic API is triggered by the service-role Supabase read), freezing
// session data as of the last deploy/revalidatePath call — new mobile
// sessions never show up until then, and the realtime router.refresh()
// hook can't help since it re-requests the same cached static payload.
export const dynamic = 'force-dynamic';

function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-6xl mx-auto py-lg">
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Unable to load sessions</h2>
            <p className="font-body text-[14px]">{error}</p>
            <p className="font-body text-[12px] mt-sm text-[#ba1a1a]/80">
              Please try refreshing the page or check your connection.
            </p>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}

export default async function Sessions() {
  try {
    const { data: sessions, useMock } = await loadLiveSessions();

    return (
      <div className="w-full h-dvh">
        <SidebarDemo>
          <SessionsPage sessions={sessions} isMock={useMock} />
        </SidebarDemo>
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error instanceof Error ? error.message : 'Failed to load sessions data'} />;
  }
}
