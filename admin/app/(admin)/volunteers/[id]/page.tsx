import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';
import type { SessionStatus } from '@/types/database';

const MOCK_VOLUNTEERS: Record<string, {
  id: string; name: string; email: string; phone: string; joinedAt: string;
  courtOrdered: boolean; requiredHours: number | null;
  sessions: Array<{ id: string; activity: string; date: string; duration: string; status: string; distance: string }>;
}> = {
  v1: { id: 'v1', name: 'Marcus Rivera', email: 'marcus.r@email.com', phone: '(312) 555-0191', joinedAt: '2026-01-15', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's1', activity: 'River Cleanup', date: '2026-07-10', duration: '45m', status: 'not_approved', distance: '1.2 mi' },
    { id: 's2', activity: 'Park Cleanup', date: '2026-07-02', duration: '1h 30m', status: 'approved', distance: '2.0 mi' },
    { id: 's3', activity: 'Trail Cleanup', date: '2026-06-21', duration: '2h', status: 'approved', distance: '3.1 mi' },
  ]},
  v2: { id: 'v2', name: 'Destiny Thompson', email: 'destiny.t@email.com', phone: '(773) 555-0124', joinedAt: '2026-02-03', courtOrdered: true, requiredHours: 40, sessions: [
    { id: 's4', activity: 'Beach Cleanup', date: '2026-07-13', duration: '2h', status: 'approved', distance: '3.1 mi' },
    { id: 's5', activity: 'Park Cleanup', date: '2026-07-05', duration: '1h 15m', status: 'approved', distance: '2.5 mi' },
    { id: 's6', activity: 'Trail Cleanup', date: '2026-06-28', duration: '1h', status: 'under_review', distance: '1.9 mi' },
  ]},
  v3: { id: 'v3', name: 'Jordan Kim', email: 'jordan.k@email.com', phone: '(708) 555-0167', joinedAt: '2025-11-20', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's7', activity: 'Park Cleanup', date: '2026-07-14', duration: '1h 30m', status: 'approved', distance: '2.3 mi' },
    { id: 's8', activity: 'Beach Cleanup', date: '2026-07-07', duration: '2h', status: 'approved', distance: '3.0 mi' },
    { id: 's9', activity: 'River Cleanup', date: '2026-06-30', duration: '1h 45m', status: 'approved', distance: '2.8 mi' },
  ]},
  v4: { id: 'v4', name: 'Priya Nair', email: 'priya.n@email.com', phone: '(847) 555-0139', joinedAt: '2026-03-10', courtOrdered: true, requiredHours: 30, sessions: [
    { id: 's10', activity: 'Beach Cleanup', date: '2026-07-08', duration: '1h 5m', status: 'under_review', distance: '1.5 mi' },
    { id: 's11', activity: 'Trail Cleanup', date: '2026-07-01', duration: '1h', status: 'approved', distance: '1.8 mi' },
    { id: 's12', activity: 'Park Cleanup', date: '2026-06-15', duration: '2h', status: 'approved', distance: '2.9 mi' },
  ]},
  v5: { id: 'v5', name: 'Devon Okafor', email: 'devon.o@email.com', phone: '(630) 555-0148', joinedAt: '2025-09-08', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's13', activity: 'Park Cleanup', date: '2026-07-09', duration: '1h 45m', status: 'approved', distance: '2.8 mi' },
    { id: 's14', activity: 'Neighborhood Cleanup', date: '2026-07-01', duration: '2h 15m', status: 'approved', distance: '3.5 mi' },
  ]},
  v6: { id: 'v6', name: 'Aaliyah Brooks', email: 'aaliyah.b@email.com', phone: '(312) 555-0177', joinedAt: '2026-06-01', courtOrdered: true, requiredHours: 20, sessions: [
    { id: 's15', activity: 'Park Cleanup', date: '2026-07-04', duration: '2h 10m', status: 'approved', distance: '4.0 mi' },
    { id: 's16', activity: 'Beach Cleanup', date: '2026-06-25', duration: '1h 30m', status: 'approved', distance: '2.4 mi' },
  ]},
  v7: { id: 'v7', name: 'Miguel Santos', email: 'miguel.s@email.com', phone: '(773) 555-0155', joinedAt: '2026-01-28', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's17', activity: 'River Cleanup', date: '2026-07-03', duration: '10m', status: 'invalid', distance: '0.3 mi' },
    { id: 's18', activity: 'Trail Cleanup', date: '2026-06-28', duration: '2h', status: 'approved', distance: '3.2 mi' },
  ]},
  v8: { id: 'v8', name: 'Fatima Hassan', email: 'fatima.h@email.com', phone: '(847) 555-0162', joinedAt: '2026-02-14', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's19', activity: 'Neighborhood Cleanup', date: '2026-07-05', duration: '55m', status: 'under_review', distance: '1.7 mi' },
    { id: 's20', activity: 'Park Cleanup', date: '2026-06-20', duration: '1h 20m', status: 'approved', distance: '2.1 mi' },
  ]},
  v9: { id: 'v9', name: 'Tyler Washington', email: 'tyler.w@email.com', phone: '(708) 555-0133', joinedAt: '2026-04-22', courtOrdered: true, requiredHours: 50, sessions: [
    { id: 's21', activity: 'Neighborhood Cleanup', date: '2026-07-11', duration: '1h 15m', status: 'approved', distance: '2.0 mi' },
    { id: 's22', activity: 'Beach Cleanup', date: '2026-07-03', duration: '1h', status: 'approved', distance: '1.8 mi' },
  ]},
  v10: { id: 'v10', name: 'Sophia Chen', email: 'sophia.c@email.com', phone: '(312) 555-0144', joinedAt: '2025-10-11', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's23', activity: 'Trail Cleanup', date: '2026-07-12', duration: '1h', status: 'under_review', distance: '1.8 mi' },
    { id: 's24', activity: 'Park Cleanup', date: '2026-07-05', duration: '2h 30m', status: 'approved', distance: '3.8 mi' },
    { id: 's25', activity: 'River Cleanup', date: '2026-06-28', duration: '1h 45m', status: 'approved', distance: '2.9 mi' },
  ]},
  v11: { id: 'v11', name: 'Isaiah Grant', email: 'isaiah.g@email.com', phone: '(630) 555-0188', joinedAt: '2026-07-01', courtOrdered: true, requiredHours: 25, sessions: [
    { id: 's26', activity: 'Highway Litter Pick', date: '2026-07-07', duration: '2h', status: 'approved', distance: '3.5 mi' },
  ]},
  v12: { id: 'v12', name: 'Luna Martinez', email: 'luna.m@email.com', phone: '(773) 555-0129', joinedAt: '2026-01-05', courtOrdered: false, requiredHours: null, sessions: [
    { id: 's27', activity: 'Trail Cleanup', date: '2026-07-06', duration: '1h 10m', status: 'approved', distance: '2.1 mi' },
    { id: 's28', activity: 'Neighborhood Cleanup', date: '2026-06-29', duration: '1h 45m', status: 'approved', distance: '2.7 mi' },
    { id: 's29', activity: 'Park Cleanup', date: '2026-06-22', duration: '2h', status: 'approved', distance: '3.0 mi' },
  ]},
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function VolunteerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const volunteer = MOCK_VOLUNTEERS[id];

  if (!volunteer) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link href="/volunteers" className="font-data text-[12px] text-primary hover:underline mb-lg inline-block">← Back to Volunteers</Link>
        <p className="font-body text-base text-text-tertiary">Volunteer not found.</p>
      </div>
    );
  }

  const approvedCount = volunteer.sessions.filter((s) => s.status === 'approved').length;
  const totalHours = approvedCount * 1.5;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/volunteers" className="font-data text-[12px] text-primary hover:underline mb-lg inline-block">
        ← Volunteers
      </Link>

      {/* Profile header */}
      <div className="bg-bg-surface border border-border-outline rounded-md p-xl mb-xl">
        <div className="flex items-start justify-between gap-md flex-wrap">
          <div>
            <div className="flex items-center gap-md mb-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-heading text-[20px] text-primary">{volunteer.name[0]}</span>
              </div>
              <div>
                <h1 className="font-heading text-[24px] leading-[32px] text-text-primary">{volunteer.name}</h1>
                {volunteer.courtOrdered && (
                  <span className="inline-block font-data text-[11px] font-semibold text-[#835400] bg-[#ffddb5] rounded-xs px-sm py-xs mt-xs">
                    Court-ordered
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-xs pl-[calc(3rem+16px)]">
              <p className="font-body text-[14px] text-text-tertiary">{volunteer.email}</p>
              <p className="font-body text-[14px] text-text-tertiary">{volunteer.phone}</p>
              <p className="font-data text-[12px] text-text-tertiary">Joined {formatDate(volunteer.joinedAt)}</p>
            </div>
          </div>

          <div className="flex gap-md flex-wrap">
            {[
              { label: 'Sessions', value: volunteer.sessions.length },
              { label: 'Approved Hours', value: `${totalHours.toFixed(1)}h` },
              ...(volunteer.courtOrdered && volunteer.requiredHours
                ? [{ label: 'Required Hours', value: `${volunteer.requiredHours}h` }]
                : []),
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-bg-surface-elevated rounded-md p-md min-w-[80px]">
                <p className="font-data text-[22px] font-semibold text-text-primary">{stat.value}</p>
                <p className="font-data text-[10px] uppercase text-text-tertiary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions */}
      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Session History</h2>
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {['Activity', 'Date', 'Duration', 'Distance', 'Status'].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">{col}</span>
          ))}
        </div>
        {volunteer.sessions.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No sessions yet.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {volunteer.sessions.map((s) => (
              <li key={s.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center px-lg py-md table-row-hover transition-colors">
                <span className="font-body text-[14px] font-medium text-text-primary">{s.activity}</span>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatDate(s.date)}</span>
                <span className="font-data text-[13px] font-medium text-text-primary whitespace-nowrap">{s.duration}</span>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{s.distance}</span>
                <StatusChip status={s.status as SessionStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-lg text-center">
        <span className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-sm px-sm py-xs">
          Mock data
        </span>
      </div>
    </div>
  );
}
