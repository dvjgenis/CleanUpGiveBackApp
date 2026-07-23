import { StatusChip } from '@/components/ui/StatusChip';

const MOCK_VOLUNTEERS = [
  { id: 'v1', name: 'Marcus Rivera', email: 'marcus.r@email.com', sessions: 14, totalHours: 38.5, courtOrdered: false, lastActive: '2026-07-19', joinedAt: '2026-01-15' },
  { id: 'v2', name: 'Destiny Thompson', email: 'destiny.t@email.com', sessions: 9, totalHours: 22.0, courtOrdered: true, lastActive: '2026-07-18', joinedAt: '2026-02-03' },
  { id: 'v3', name: 'Jordan Kim', email: 'jordan.k@email.com', sessions: 21, totalHours: 61.75, courtOrdered: false, lastActive: '2026-07-20', joinedAt: '2025-11-20' },
  { id: 'v4', name: 'Priya Nair', email: 'priya.n@email.com', sessions: 6, totalHours: 15.25, courtOrdered: true, lastActive: '2026-07-15', joinedAt: '2026-03-10' },
  { id: 'v5', name: 'Devon Okafor', email: 'devon.o@email.com', sessions: 33, totalHours: 94.0, courtOrdered: false, lastActive: '2026-07-21', joinedAt: '2025-09-08' },
  { id: 'v6', name: 'Aaliyah Brooks', email: 'aaliyah.b@email.com', sessions: 4, totalHours: 9.5, courtOrdered: true, lastActive: '2026-07-10', joinedAt: '2026-06-01' },
  { id: 'v7', name: 'Miguel Santos', email: 'miguel.s@email.com', sessions: 18, totalHours: 49.0, courtOrdered: false, lastActive: '2026-07-17', joinedAt: '2026-01-28' },
  { id: 'v8', name: 'Fatima Hassan', email: 'fatima.h@email.com', sessions: 11, totalHours: 30.25, courtOrdered: false, lastActive: '2026-07-16', joinedAt: '2026-02-14' },
  { id: 'v9', name: 'Tyler Washington', email: 'tyler.w@email.com', sessions: 7, totalHours: 18.0, courtOrdered: true, lastActive: '2026-07-12', joinedAt: '2026-04-22' },
  { id: 'v10', name: 'Sophia Chen', email: 'sophia.c@email.com', sessions: 26, totalHours: 72.5, courtOrdered: false, lastActive: '2026-07-20', joinedAt: '2025-10-11' },
  { id: 'v11', name: 'Isaiah Grant', email: 'isaiah.g@email.com', sessions: 3, totalHours: 7.0, courtOrdered: true, lastActive: '2026-07-08', joinedAt: '2026-07-01' },
  { id: 'v12', name: 'Luna Martinez', email: 'luna.m@email.com', sessions: 15, totalHours: 41.0, courtOrdered: false, lastActive: '2026-07-19', joinedAt: '2026-01-05' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VolunteersPage() {
  const total = MOCK_VOLUNTEERS.length;
  const courtOrdered = MOCK_VOLUNTEERS.filter((v) => v.courtOrdered).length;
  const totalHours = MOCK_VOLUNTEERS.reduce((sum, v) => sum + v.totalHours, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Volunteers</h1>
        <span className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-sm px-sm py-xs">
          Mock data
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-md mb-xl">
        {[
          { label: 'Total Volunteers', value: total },
          { label: 'Court-Ordered', value: courtOrdered },
          { label: 'Combined Hours', value: `${totalHours.toFixed(0)}h` },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">{stat.label}</p>
            <p className="font-data text-[28px] font-semibold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {['Name', 'Joined', 'Sessions', 'Hours', 'Type', 'Last Active'].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">{col}</span>
          ))}
        </div>
        <ul role="list" className="divide-y divide-border-outline">
          {MOCK_VOLUNTEERS.map((v) => (
            <li key={v.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-md items-center px-lg py-md table-row-hover transition-colors">
              <div>
                <p className="font-body text-[14px] font-medium text-text-primary">{v.name}</p>
                <p className="font-body text-[12px] text-text-tertiary">{v.email}</p>
              </div>
              <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatDate(v.joinedAt)}</span>
              <span className="font-data text-[13px] font-medium text-text-primary text-center">{v.sessions}</span>
              <span className="font-data text-[13px] font-medium text-primary text-center">{v.totalHours.toFixed(1)}h</span>
              <span className={`font-data text-[11px] font-semibold px-sm py-xs rounded-xs whitespace-nowrap ${v.courtOrdered ? 'bg-[#ffddb5] text-[#835400]' : 'bg-[#f7fff1] text-primary'}`}>
                {v.courtOrdered ? 'Court-ordered' : 'Voluntary'}
              </span>
              <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatDate(v.lastActive)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
