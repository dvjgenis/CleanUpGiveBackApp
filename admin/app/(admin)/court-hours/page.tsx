const MOCK_COURT_VOLUNTEERS = [
  { id: 'c1', name: 'Destiny Thompson', email: 'destiny.t@email.com', requiredHours: 40, completedHours: 22.0, sessions: 9, status: 'in_progress', dueDate: '2026-09-15' },
  { id: 'c2', name: 'Priya Nair', email: 'priya.n@email.com', requiredHours: 30, completedHours: 15.25, sessions: 6, status: 'in_progress', dueDate: '2026-08-30' },
  { id: 'c3', name: 'Aaliyah Brooks', email: 'aaliyah.b@email.com', requiredHours: 20, completedHours: 9.5, sessions: 4, status: 'in_progress', dueDate: '2026-08-01' },
  { id: 'c4', name: 'Tyler Washington', email: 'tyler.w@email.com', requiredHours: 50, completedHours: 18.0, sessions: 7, status: 'in_progress', dueDate: '2026-10-01' },
  { id: 'c5', name: 'Isaiah Grant', email: 'isaiah.g@email.com', requiredHours: 25, completedHours: 7.0, sessions: 3, status: 'at_risk', dueDate: '2026-07-31' },
  { id: 'c6', name: 'Kezia Osei', email: 'kezia.o@email.com', requiredHours: 60, completedHours: 60.0, sessions: 22, status: 'completed', dueDate: '2026-07-10' },
  { id: 'c7', name: 'Darius Powell', email: 'darius.p@email.com', requiredHours: 35, completedHours: 35.0, sessions: 13, status: 'completed', dueDate: '2026-06-30' },
  { id: 'c8', name: 'Nadia Flores', email: 'nadia.f@email.com', requiredHours: 45, completedHours: 12.5, sessions: 5, status: 'at_risk', dueDate: '2026-07-28' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProgressBar({ pct }: { pct: number }) {
  const clipped = Math.min(100, pct);
  const color = pct >= 100 ? '#007536' : pct >= 60 ? '#5a8f3a' : pct >= 30 ? '#835400' : '#ba1a1a';
  return (
    <div className="w-full bg-bg-surface-elevated rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${clipped}%`, backgroundColor: color }} />
    </div>
  );
}

export default function CourtHoursPage() {
  const completed = MOCK_COURT_VOLUNTEERS.filter((v) => v.status === 'completed').length;
  const atRisk = MOCK_COURT_VOLUNTEERS.filter((v) => v.status === 'at_risk').length;
  const inProgress = MOCK_COURT_VOLUNTEERS.filter((v) => v.status === 'in_progress').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Court Hours</h1>
        <span className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-sm px-sm py-xs">
          Mock data
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-md mb-xl">
        {[
          { label: 'In Progress', value: inProgress, color: 'text-[#835400]' },
          { label: 'At Risk', value: atRisk, color: 'text-[#ba1a1a]' },
          { label: 'Completed', value: completed, color: 'text-primary' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">{stat.label}</p>
            <p className={`font-data text-[28px] font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-md">
        {MOCK_COURT_VOLUNTEERS.map((v) => {
          const pct = (v.completedHours / v.requiredHours) * 100;
          const remaining = Math.max(0, v.requiredHours - v.completedHours);
          const statusLabel = v.status === 'completed' ? 'Completed' : v.status === 'at_risk' ? 'At risk' : 'In progress';
          const statusClass =
            v.status === 'completed'
              ? 'bg-[#f7fff1] text-primary border-primary/30'
              : v.status === 'at_risk'
              ? 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]/30'
              : 'bg-[#ffddb5] text-[#835400] border-[#fcab29]/30';

          return (
            <div key={v.id} className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <div className="flex items-start justify-between gap-md mb-md">
                <div>
                  <p className="font-body text-[15px] font-semibold text-text-primary">{v.name}</p>
                  <p className="font-body text-[13px] text-text-tertiary">{v.email}</p>
                </div>
                <div className="flex items-center gap-sm shrink-0">
                  <span className={`font-data text-[11px] font-semibold tracking-[0.5px] uppercase px-sm py-xs rounded-xs border ${statusClass}`}>
                    {statusLabel}
                  </span>
                  <span className="font-data text-[12px] text-text-tertiary">Due {formatDate(v.dueDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="font-data text-[12px] text-text-tertiary">Progress</span>
                    <span className="font-data text-[12px] font-semibold text-text-primary">
                      {v.completedHours.toFixed(1)} / {v.requiredHours}h ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-data text-[11px] uppercase text-text-tertiary">Remaining</p>
                  <p className="font-data text-[20px] font-semibold text-text-primary">{remaining.toFixed(1)}h</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-data text-[11px] uppercase text-text-tertiary">Sessions</p>
                  <p className="font-data text-[20px] font-semibold text-text-primary">{v.sessions}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
