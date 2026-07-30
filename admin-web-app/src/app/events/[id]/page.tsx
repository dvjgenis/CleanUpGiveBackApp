import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EventDetailPage, type EventDetailLiveActions } from "@/components/pages/EventDetailPage";
import { EVENTS, eventListItemToDemoEvent } from "@/components/pages/EventsPage";
import { loadLiveEvent } from "@/lib/live-data";
import { createDataClient } from "@/lib/supabase/server";
import { getVolunteerDirectory } from "@/lib/volunteers";
import { buildCourtRisk, type CourtOrderRow } from "@/lib/court-risk";

type NoticeRow = { user_id: string; notified_at: string };
type SessionForRisk = {
  user_id: string;
  status: string;
  court_ordered: boolean;
  duration_seconds: number | null;
  adjusted_hours: number | null;
};

async function loadLiveActions(eventId: string, isPublished: boolean): Promise<EventDetailLiveActions> {
  const supabase = await createDataClient();

  const [{ data: courtOrders }, { data: sessions }, { data: notices }, directory] = await Promise.all([
    supabase.from("court_orders").select("user_id, required_hours, due_date"),
    supabase.from("sessions").select("user_id, status, court_ordered, duration_seconds, adjusted_hours"),
    supabase.from("event_volunteer_notices").select("user_id, notified_at").eq("event_id", eventId),
    getVolunteerDirectory(),
  ]);

  const lastByUser = new Map(((notices as NoticeRow[] | null) ?? []).map((n) => [n.user_id, n.notified_at]));

  const risk = buildCourtRisk(
    (courtOrders as CourtOrderRow[] | null) ?? [],
    (sessions as SessionForRisk[] | null) ?? [],
    directory,
    new Date(),
  );

  const atRiskCandidates = risk
    .filter((r) => r.status === "at_risk")
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: directory.get(r.id)?.email ?? null,
      remainingHours: Math.max(0, r.requiredHours - r.completedHours),
      lastNotifiedAt: lastByUser.get(r.id) ?? null,
    }));

  return { eventId, isPublished, atRiskCandidates };
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const liveEvent = await loadLiveEvent(id);
  const event = liveEvent ? eventListItemToDemoEvent(liveEvent) : (EVENTS.find((e) => e.id === id) ?? null);
  const liveActions = liveEvent ? await loadLiveActions(liveEvent.id, liveEvent.is_published) : null;

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EventDetailPage event={event} liveActions={liveActions} />
      </SidebarDemo>
    </div>
  );
}
