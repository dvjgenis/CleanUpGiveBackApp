'use client';

/** Port of `admin/components/ui/CourtProgressChart.tsx` — scrolls in place past
 * `VISIBLE_LIMIT` rows instead of a click-to-expand button, so the card's height
 * stays fixed on the page regardless of how many volunteers are court-ordered.
 * Donna can also open a full-screen view to scan the full list with search. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { IoSearch } from 'react-icons/io5';
import { CollapseIcon, ExpandIcon } from '@/components/ui/Icons';
import { useHasMounted } from '@/hooks/useHasMounted';

const shell =
  'bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md';

const VISIBLE_LIMIT = 5;
/** Fits ~VISIBLE_LIMIT rows before scrolling kicks in (card view only). */
const SCROLL_MAX_HEIGHT_PX = 320;

export type CourtProgressRow = {
  id: string;
  name: string;
  completed: number;
  remaining: number;
  pct: number;
  status: string;
};

type Props = {
  title: string;
  subtitle?: string;
  data: CourtProgressRow[];
  index?: number;
};

function ProgressRow({ row }: { row: CourtProgressRow }) {
  const behind = row.status === 'at_risk';
  const widthPct = Math.round(row.pct);
  return (
    <li>
      <div className="flex items-center justify-between gap-sm mb-xs">
        <Link
          href={`/volunteers/${row.id}`}
          className="font-body text-[13px] font-medium text-primary truncate hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
        >
          {row.name}
        </Link>
        <span
          className={`font-data text-[11px] font-semibold shrink-0 ${
            behind ? 'text-[#ba1a1a]' : 'text-[#835400]'
          }`}
        >
          {widthPct}%
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-bg-surface-elevated overflow-hidden flex"
        role="img"
        aria-label={`${row.name}: ${row.completed.toFixed(1)} of ${
          row.completed + row.remaining
        } hours complete`}
      >
        <div
          className="h-full transition-[width] duration-[450ms] ease-out motion-reduce:transition-none"
          style={{
            width: `${widthPct}%`,
            backgroundColor: behind ? '#ba1a1a' : '#007536',
          }}
        />
      </div>
      <p className="mt-xs font-data text-[11px] text-text-tertiary">
        {row.completed.toFixed(1)}h done · {row.remaining.toFixed(1)}h left
      </p>
    </li>
  );
}

/** Stacked progress toward court-required hours — scan who is behind. */
export function CourtProgressChart({ title, subtitle, data, index = 0 }: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useHasMounted();
  const [query, setQuery] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q ? data.filter((row) => row.name.toLowerCase().includes(q)) : data;
  const scrolls = !fullscreen && filtered.length > VISIBLE_LIMIT;

  useEffect(() => {
    if (!fullscreen) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const searchField = data.length > 0 && (
    <label className="relative block">
      <span className="sr-only">Search court progress by name</span>
      <IoSearch
        aria-hidden
        className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-text-tertiary"
        size={16}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name…"
        className="w-full h-10 pl-10 pr-md rounded-sm border border-border-outline bg-bg-surface font-body text-[13px] placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      />
    </label>
  );

  const listBody =
    data.length === 0 ? (
      <div className="py-lg text-center">
        <p className="font-body text-[13px] text-text-tertiary">No court volunteers at risk</p>
      </div>
    ) : filtered.length === 0 ? (
      <div className="py-md text-center">
        <p className="font-body text-[13px] text-text-tertiary">
          No volunteers match “{query.trim()}”
        </p>
      </div>
    ) : (
      <ul
        className={`flex flex-col gap-md ${
          fullscreen ? 'flex-1 min-h-0 overflow-y-auto pr-xs' : scrolls ? 'overflow-y-auto pr-xs' : ''
        }`}
        style={!fullscreen && scrolls ? { maxHeight: SCROLL_MAX_HEIGHT_PX } : undefined}
        role="list"
      >
        {filtered.map((row) => (
          <ProgressRow key={row.id} row={row} />
        ))}
      </ul>
    );

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-bg-app flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — full screen`}
      >
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-md px-lg py-md border-b border-border-outline bg-bg-surface">
          <div className="min-w-0">
            <p className="font-heading text-[20px] leading-[28px] text-text-primary truncate">
              {title}
            </p>
            {subtitle && (
              <p className="font-body text-[12px] text-text-tertiary mt-xs">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="shrink-0 inline-flex h-11 items-center gap-sm px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Exit full screen"
          >
            <CollapseIcon className="w-4 h-4" />
            Exit full screen
          </button>
        </header>
        <div className="flex-1 min-h-0 flex flex-col gap-md p-lg max-w-3xl w-full mx-auto">
          {searchField}
          {listBody}
        </div>
      </div>
    );
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <p className="font-data text-[11px] leading-[16px] tracking-[1px] text-text-tertiary uppercase">
            {title}
          </p>
          {subtitle && (
            <p className="font-body text-[12px] text-text-tertiary mt-xs">{subtitle}</p>
          )}
        </div>
        {data.length > 0 && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border-outline bg-bg-app text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="View court progress full screen"
            aria-pressed="false"
          >
            <ExpandIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {searchField}
      {listBody}
    </>
  );

  if (!mounted) return <div className={shell}>{body}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 + index * 0.05 }}
      className={shell}
    >
      {body}
    </motion.div>
  );
}
