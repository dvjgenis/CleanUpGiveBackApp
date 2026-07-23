import { createClient } from '@/lib/supabase/server';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { SessionsClientShell } from './SessionsClientShell';
import type { SessionStatus } from '@/types/database';

const PAGE_SIZE = 25;

interface SearchParams {
  status?: string;
  page?: string;
  q?: string;
  court?: string;
  sort?: string;
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const statusFilter = params.status as SessionStatus | 'all' | undefined;
  const q = params.q ?? '';
  const courtOnly = params.court === '1';
  const sort = params.sort ?? 'newest';

  const supabase = await createClient();

  let query = supabase
    .from('sessions')
    .select('id, user_id, activity, started_at, ended_at, duration_seconds, adjusted_hours, distance_miles, status, court_ordered, created_at', { count: 'exact' });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (courtOnly) {
    query = query.eq('court_ordered', true);
  }

  switch (sort) {
    case 'oldest':
      query = query.order('started_at', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('started_at', { ascending: false });
      break;
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data: sessions, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const sessionRows = (sessions ?? []).map((s) => ({
    ...s,
    description: null,
    route: null,
    admin_notes: null,
    letterhead_generated_at: null,
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Sessions</h1>
      </div>

      <SessionsClientShell
        sessions={sessionRows}
        totalCount={count ?? 0}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={statusFilter ?? 'all'}
        currentQ={q}
        courtOnly={courtOnly}
        sort={sort}
      />
    </div>
  );
}
