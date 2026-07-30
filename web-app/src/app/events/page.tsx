import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EventsPage, eventListItemToDemoEvent } from "@/components/pages/EventsPage";
import { loadLiveEvents } from "@/lib/live-data";

export default async function Events() {
  const { data: liveEvents, useMock } = await loadLiveEvents();
  const events = useMock ? undefined : liveEvents.map(eventListItemToDemoEvent);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EventsPage events={events} isMock={useMock} />
      </SidebarDemo>
    </div>
  );
}
