'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { approveSession, declineSession } from '@/actions/sessions';
import type { Session, SessionStatus } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'not_approved', label: 'Declined' },
  { value: 'invalid', label: 'Invalid' },
];

interface Props {
  sessions: Session[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentQ: string;
  courtOnly: boolean;
  sort: string;
}

export function SessionsClientShell({
  sessions,
  totalCount,
  totalPages,
  currentPage,
  currentStatus,
  currentQ,
  courtOnly,
  sort,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string>) {
    const sp = new URLSearchParams();
    if (currentStatus !== 'all') sp.set('status', currentStatus);
    if (currentQ) sp.set('q', currentQ);
    if (courtOnly) sp.set('court', '1');
    if (sort !== 'newest') sp.set('sort', sort);
    sp.set('page', '1');
    Object.entries(updates).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-sm mb-lg">
        <div
          className="flex gap-xs overflow-x-auto pb-xs"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={currentStatus === f.value}
              onClick={() => updateParams({ status: f.value === 'all' ? '' : f.value, page: '1' })}
              className={`min-h-11 px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                currentStatus === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-sm min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={courtOnly}
            onChange={(e) => updateParams({ court: e.target.checked ? '1' : '' })}
            className="w-4 h-4 accent-primary"
          />
          <span className="font-data text-[12px] font-semibold text-text-tertiary">Court-ordered only</span>
        </label>

        <label className="inline-flex items-center gap-sm min-h-11">
          <span className="sr-only">Sort sessions</span>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            aria-label="Sort sessions"
            className="min-h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] text-text-primary focus:outline-none focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

        <span className="ml-auto font-body text-[14px] text-text-tertiary self-center">
          {totalCount} session{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline bg-bg-surface-elevated">
                {['Date', 'Activity', 'Duration', 'Distance', 'Status', 'Court', 'Actions'].map((h) => (
                  <th key={h} className="px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline">
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-lg py-xl text-center font-body text-base text-text-tertiary">
                    No sessions found.
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-border-outline">
          {sessions.length === 0 && (
            <p className="px-lg py-xl text-center font-body text-base text-text-tertiary">No sessions found.</p>
          )}
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-md mt-lg">
          {currentPage > 1 && (
            <button
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
            >
              ← Previous
            </button>
          )}
          <span className="font-data text-[12px] text-text-tertiary">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <button
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              className="h-9 px-md rounded-sm border border-border-outline font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approveSession(session.id);
    });
  }

  function handleDecline() {
    startTransition(async () => {
      await declineSession(session.id, declineReason || undefined);
      setShowDecline(false);
    });
  }

  return (
    <tr className="table-row-hover transition-colors relative">
      <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
        {formatDate(session.started_at)}
      </td>
      <td className="px-lg py-md">
        <Link href={`/sessions/${session.id}`} className="font-body text-base text-text-primary hover:text-primary hover:underline">
          {session.activity ?? '—'}
        </Link>
        <p className="font-data text-[11px] text-text-tertiary">{shortId(session.id)}</p>
      </td>
      <td className="px-lg py-md font-body text-[14px] text-text-primary whitespace-nowrap">
        {formatDuration(session.duration_seconds, session.adjusted_hours)}
      </td>
      <td className="px-lg py-md font-body text-[14px] text-text-tertiary whitespace-nowrap">
        {formatMiles(session.distance_miles)}
      </td>
      <td className="px-lg py-md">
        <StatusChip status={session.status} />
      </td>
      <td className="px-lg py-md text-center">
        {session.court_ordered && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ffddb5] text-[#835400]" title="Court-ordered">⚖️</span>
        )}
      </td>
      <td className="px-lg py-md">
        <div className="flex items-center gap-sm relative">
          {session.status === 'under_review' && (
            <>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="h-8 px-sm rounded-sm bg-[#f7fff1] border border-primary text-primary font-data text-[11px] font-semibold hover:bg-[#e0ffe8] transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setShowDecline(!showDecline)}
                disabled={isPending}
                className="h-8 px-sm rounded-sm bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] font-data text-[11px] font-semibold hover:bg-[#ffc5ca] transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}
          <Link href={`/sessions/${session.id}`} className="h-8 px-sm rounded-sm border border-border-outline text-text-tertiary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated transition-colors flex items-center">
            View
          </Link>

          {/* Decline popover */}
          <AnimatePresence>
            {showDecline && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-full left-0 z-20 mt-xs w-72 bg-bg-surface border border-border-outline rounded-md p-md shadow-lg"
                style={{ transformOrigin: 'top left' }}
              >
                <p className="font-body text-base font-medium text-text-primary mb-sm">Decline session</p>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={2}
                  className="w-full rounded-sm border border-border-outline p-sm font-body text-[14px] text-text-primary focus:outline-none focus:border-primary resize-none mb-sm"
                />
                <div className="flex gap-sm justify-end">
                  <button
                    onClick={() => setShowDecline(false)}
                    className="h-8 px-md font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={isPending}
                    className="h-8 px-md font-data text-[12px] font-semibold bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] rounded-sm hover:bg-[#ffc5ca] transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Declining…' : 'Decline'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <Link href={`/sessions/${session.id}`} className="block px-lg py-md table-row-hover transition-colors">
      <div className="flex items-start justify-between gap-md mb-sm">
        <div>
          <p className="font-body text-base font-medium text-text-primary">{session.activity ?? 'Cleanup session'}</p>
          <p className="font-body text-[14px] text-text-tertiary">{formatDate(session.started_at)}</p>
        </div>
        <StatusChip status={session.status} />
      </div>
      <div className="flex items-center gap-lg text-[14px] text-text-tertiary font-body">
        <span>{formatDuration(session.duration_seconds, session.adjusted_hours)}</span>
        <span>{formatMiles(session.distance_miles)}</span>
        {session.court_ordered && <span>⚖️ Court</span>}
      </div>
    </Link>
  );
}
