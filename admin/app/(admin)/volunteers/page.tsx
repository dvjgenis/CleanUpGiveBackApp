import Link from 'next/link';
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, getVolunteerName } from '@/lib/volunteers';
import { computedHours, formatDate } from '@/lib/format';

type SessionAgg = {
  sessionCount: number;
  totalApprovedHours: number;
  lastActive: string | null;
};

export default async function VolunteersPage() {
  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  const [{ data: sessions }, { data: courtOrders }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select('user_id, status, court_ordered, duration_seconds, adjusted_hours, created_at'),
    supabase.from('court_orders').select('user_id'),
    serviceClient ? getVolunteerDirectory(serviceClient) : Promise.resolve(new Map()),
  ]);

  const courtUserIds = new Set((courtOrders ?? []).map((o) => o.user_id));

  const aggByUser = new Map<string, SessionAgg>();
  for (const s of sessions ?? []) {
    const existing = aggByUser.get(s.user_id) ?? {
      sessionCount: 0,
      totalApprovedHours: 0,
      lastActive: null,
    };
    existing.sessionCount += 1;
    if (s.status === 'approved') {
      existing.totalApprovedHours += computedHours(s.duration_seconds, s.adjusted_hours);
    }
    if (!existing.lastActive || s.created_at > existing.lastActive) {
      existing.lastActive = s.created_at;
    }
    aggByUser.set(s.user_id, existing);
  }

  const userIds =
    directory.size > 0
      ? [...directory.keys()]
      : [...new Set((sessions ?? []).map((s) => s.user_id))];

  const volunteers = userIds
    .map((id) => {
      const entry = directory.get(id);
      const agg = aggByUser.get(id);
      return {
        id,
        name: entry?.name ?? getVolunteerName(directory, id),
        email: entry?.email ?? '—',
        sessions: agg?.sessionCount ?? 0,
        totalHours: agg?.totalApprovedHours ?? 0,
        courtOrdered: courtUserIds.has(id),
        lastActive: agg?.lastActive ?? null,
        joinedAt: entry?.createdAt ?? agg?.lastActive ?? null,
      };
    })
    .sort((a, b) => {
      if (a.lastActive && b.lastActive) return b.lastActive.localeCompare(a.lastActive);
      if (a.lastActive) return -1;
      if (b.lastActive) return 1;
      return a.name.localeCompare(b.name);
    });

  const total = volunteers.length;
  const courtOrdered = volunteers.filter((v) => v.courtOrdered).length;
  const totalHours = volunteers.reduce((sum, v) => sum + v.totalHours, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Volunteers</h1>
      </div>
      {!serviceClient && (
        <p role="status" className="mb-md font-body text-[13px] text-text-tertiary">
          Volunteer names limited — add <span className="font-data">SUPABASE_SERVICE_ROLE_KEY</span> to{' '}
          <span className="font-data">admin/.env.local</span> for full Auth directory.
        </p>
      )}

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

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {['Name', 'Joined', 'Sessions', 'Hours', 'Type', 'Last Active'].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">{col}</span>
          ))}
        </div>
        {volunteers.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No volunteers yet.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {volunteers.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/volunteers/${v.id}`}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-md items-center px-lg py-md table-row-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
                >
                  <div>
                    <p className="font-body text-[14px] font-medium text-text-primary group-hover:underline">{v.name}</p>
                    <p className="font-body text-[12px] text-text-tertiary">{v.email}</p>
                  </div>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                    {v.joinedAt ? formatDate(v.joinedAt) : '—'}
                  </span>
                  <span className="font-data text-[13px] font-medium text-text-primary text-center">{v.sessions}</span>
                  <span className="font-data text-[13px] font-medium text-primary text-center">{v.totalHours.toFixed(1)}h</span>
                  <span className={`font-data text-[11px] font-semibold px-sm py-xs rounded-xs whitespace-nowrap ${v.courtOrdered ? 'bg-[#ffddb5] text-[#835400]' : 'bg-[#f7fff1] text-primary'}`}>
                    {v.courtOrdered ? 'Court-ordered' : 'Voluntary'}
                  </span>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                    {v.lastActive ? formatDate(v.lastActive) : 'Never'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
