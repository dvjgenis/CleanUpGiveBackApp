import Link from 'next/link';
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory } from '@/lib/volunteers';
import { buildCourtRisk } from '@/lib/court-risk';
import { MOCK_COURT_HOURS } from '@/lib/dashboard-mock';
import type { CourtOrder } from '@/types/database';
import type { CourtRiskItem } from '@/components/dashboard/types';

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

type CourtRow = CourtRiskItem & {
  email: string;
  sessionCount: number;
};

export default async function CourtHoursPage() {
  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  const [{ data: courtOrders }, { data: sessions }, directory] = await Promise.all([
    supabase.from('court_orders').select('*'),
    supabase.from('sessions').select('user_id, status, court_ordered, duration_seconds, adjusted_hours'),
    serviceClient ? getVolunteerDirectory(serviceClient) : Promise.resolve(new Map()),
  ]);

  const useMock = !courtOrders || courtOrders.length === 0;

  let items: CourtRow[];
  if (useMock) {
    items = MOCK_COURT_HOURS.map((v) => ({
      id: v.id,
      name: v.name,
      requiredHours: v.requiredHours,
      completedHours: v.completedHours,
      status: v.status,
      dueDate: v.dueDate,
      email: v.email,
      sessionCount: v.sessions,
    }));
  } else {
    const riskItems = buildCourtRisk((courtOrders ?? []) as CourtOrder[], sessions ?? [], directory, new Date());
    const sessionCountByUser = new Map<string, number>();
    for (const s of sessions ?? []) {
      if (s.status === 'approved' && s.court_ordered) {
        sessionCountByUser.set(s.user_id, (sessionCountByUser.get(s.user_id) ?? 0) + 1);
      }
    }
    items = riskItems.map((v) => ({
      ...v,
      email: directory.get(v.id)?.email ?? '—',
      sessionCount: sessionCountByUser.get(v.id) ?? 0,
    }));
  }

  const statusRank = { at_risk: 0, in_progress: 1, completed: 2 } as const;
  items = [...items].sort((a, b) => {
    const rank = statusRank[a.status] - statusRank[b.status];
    if (rank !== 0) return rank;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const completed = items.filter((v) => v.status === 'completed').length;
  const atRisk = items.filter((v) => v.status === 'at_risk').length;
  const inProgress = items.filter((v) => v.status === 'in_progress').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Court Hours</h1>
      </div>

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

      {items.length === 0 ? (
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg text-center">
          <p className="font-body text-[14px] text-text-tertiary">No court-ordered volunteers yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {items.map((v) => {
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
              <Link
                key={v.id}
                href={`/volunteers/${v.id}`}
                className="block bg-bg-surface border border-border-outline rounded-md p-lg table-row-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
              >
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
                    <p className="font-data text-[20px] font-semibold text-text-primary">{v.sessionCount}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
