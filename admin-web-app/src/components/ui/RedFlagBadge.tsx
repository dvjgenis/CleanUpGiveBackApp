'use client';

import { useState } from 'react';
import type { RedFlag } from '@/lib/session-red-flags';

/**
 * Advisory badge for the checklist's "Quick red-flag bundle" — never a bare
 * "SUSPICIOUS" label (the checklist warns "One red flag ≠ decline"), always a
 * hover/click tooltip listing which specific conditions triggered.
 */
export function RedFlagBadge({ flags, className = '' }: { flags: RedFlag[]; className?: string }) {
  const [open, setOpen] = useState(false);
  if (flags.length === 0) return null;

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#fff4d6] text-[#835400] border-[#e0ac47]"
      >
        {flags.length} flag{flags.length === 1 ? '' : 's'} to review
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute z-10 top-full left-0 mt-xs w-64 rounded-sm border border-[#e0ac47] bg-bg-app px-sm py-sm shadow-bar-top"
        >
          <ul className="flex flex-col gap-xs">
            {flags.map((flag) => (
              <li key={flag.key} className="font-body text-[12px] text-text-primary">
                {flag.label}
              </li>
            ))}
          </ul>
          <p className="font-body text-[11px] text-text-tertiary mt-sm pt-sm border-t border-border-outline">
            Signals only — cross-reference with the evidence before deciding.
          </p>
        </div>
      )}
    </span>
  );
}
