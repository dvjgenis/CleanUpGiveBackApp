const MOCK_EVENTS = [
  { id: 'e1', title: 'Riverside Park Mega Cleanup', description: 'Join us for our largest cleanup event of the year along the Riverside Park trail system.', location: 'Riverside Park', address: '1200 Riverside Dr', date: '2026-08-02', time: '08:00', spotsTotal: 50, spotsRegistered: 43, status: 'upcoming' },
  { id: 'e2', title: 'Downtown Litter Blitz', description: 'A fast-paced cleanup covering the downtown core and surrounding streets.', location: 'Downtown Commons', address: '400 Main St', date: '2026-07-26', time: '09:00', spotsTotal: 30, spotsRegistered: 28, status: 'upcoming' },
  { id: 'e3', title: 'Lakefront Summer Cleanup', description: 'Help keep the lakefront beautiful ahead of the summer festival season.', location: 'North Lakefront', address: 'Lakeshore Blvd & Oak Ave', date: '2026-07-19', time: '07:30', spotsTotal: 40, spotsRegistered: 40, status: 'completed' },
  { id: 'e4', title: 'Community Garden Restoration', description: 'Remove invasive plants and litter from the community garden network.', location: 'Eastside Community Garden', address: '85 Garden Row', date: '2026-07-12', time: '08:00', spotsTotal: 25, spotsRegistered: 22, status: 'completed' },
  { id: 'e5', title: 'Highway Corridor Sweep', description: 'Court-ordered volunteer session — highway shoulder cleanup.', location: 'I-90 Corridor', address: 'Exit 14 Rest Area', date: '2026-08-09', time: '07:00', spotsTotal: 20, spotsRegistered: 12, status: 'upcoming' },
  { id: 'e6', title: 'Beach Access Trail Cleanup', description: 'Restore the beach access trails before peak summer traffic.', location: 'Sunset Beach', address: 'Sunset Beach Parking Lot', date: '2026-08-16', time: '08:30', spotsTotal: 35, spotsRegistered: 7, status: 'upcoming' },
];

function formatEventDate(dateStr: string, time: string) {
  const d = new Date(`${dateStr}T${time}`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventsPage() {
  const upcoming = MOCK_EVENTS.filter((e) => e.status === 'upcoming');
  const past = MOCK_EVENTS.filter((e) => e.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Events</h1>
        <div className="flex items-center gap-md">
          <span className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-sm px-sm py-xs">
            Mock data
          </span>
          <button className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors flex items-center gap-sm" disabled>
            + New Event
          </button>
        </div>
      </div>

      {/* Upcoming */}
      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Upcoming ({upcoming.length})</h2>
      <div className="grid gap-md mb-xl">
        {upcoming.map((ev) => {
          const fillPct = Math.round((ev.spotsRegistered / ev.spotsTotal) * 100);
          const almostFull = fillPct >= 90;
          return (
            <div key={ev.id} className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <div className="flex items-start justify-between gap-md">
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[17px] text-text-primary mb-xs">{ev.title}</p>
                  <p className="font-body text-[13px] text-text-tertiary mb-sm">{ev.description}</p>
                  <div className="flex flex-wrap gap-md">
                    <span className="font-data text-[12px] text-text-tertiary">📍 {ev.location}</span>
                    <span className="font-data text-[12px] text-text-tertiary">📅 {formatEventDate(ev.date, ev.time)}</span>
                    <span className="font-data text-[12px] text-text-tertiary">🕐 {ev.time}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-data text-[11px] uppercase text-text-tertiary mb-xs">Registered</p>
                  <p className={`font-data text-[22px] font-semibold ${almostFull ? 'text-[#835400]' : 'text-text-primary'}`}>
                    {ev.spotsRegistered}<span className="text-[14px] text-text-tertiary font-normal">/{ev.spotsTotal}</span>
                  </p>
                  {almostFull && (
                    <span className="font-data text-[11px] text-[#835400]">Almost full</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past */}
      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Past ({past.length})</h2>
      <div className="grid gap-md">
        {past.map((ev) => (
          <div key={ev.id} className="bg-bg-surface border border-border-outline rounded-md p-lg opacity-75">
            <div className="flex items-start justify-between gap-md">
              <div>
                <p className="font-heading text-[17px] text-text-primary mb-xs">{ev.title}</p>
                <div className="flex flex-wrap gap-md">
                  <span className="font-data text-[12px] text-text-tertiary">📍 {ev.location}</span>
                  <span className="font-data text-[12px] text-text-tertiary">📅 {formatEventDate(ev.date, ev.time)}</span>
                </div>
              </div>
              <div className="shrink-0">
                <span className="font-data text-[11px] font-semibold text-primary bg-[#f7fff1] border border-primary/30 rounded-xs px-sm py-xs">Completed</span>
                <p className="font-data text-[12px] text-text-tertiary mt-xs text-right">{ev.spotsRegistered} attended</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
