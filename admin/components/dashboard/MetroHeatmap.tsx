'use client';

import { useMemo, useState } from 'react';
import {
  METRO_NAME,
  METRO_NEIGHBORHOODS,
  heatFill,
  heatText,
  type NeighborhoodStats,
} from '@/lib/metro-heatmap';

type Props = {
  stats: NeighborhoodStats[];
  periodLabel: string;
  isMock?: boolean;
  onSelectNeighborhood?: (id: string | null) => void;
  selectedId?: string | null;
};

export function MetroHeatmap({
  stats,
  periodLabel,
  isMock = false,
  onSelectNeighborhood,
  selectedId = null,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const byId = useMemo(() => {
    const map = new Map(stats.map((s) => [s.id, s]));
    return map;
  }, [stats]);

  const maxCount = Math.max(1, ...stats.map((s) => s.sessionCount));
  const activeId = hoveredId ?? selectedId;
  const active = activeId ? byId.get(activeId) : null;
  const ranked = [...stats].sort((a, b) => b.sessionCount - a.sessionCount);

  return (
    <section
      className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      aria-labelledby="metro-heatmap-heading"
    >
      <div className="px-lg py-md border-b border-border-outline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <h2 id="metro-heatmap-heading" className="font-heading text-[18px] leading-[26px] text-text-primary">
            {METRO_NAME} activity
          </h2>
          <p className="font-body text-[13px] text-text-tertiary">
            Neighborhood heat · {periodLabel}
            {isMock ? ' · mock centroids' : ''}
          </p>
        </div>
        <div className="flex items-center gap-sm" aria-hidden>
          <span className="font-data text-[10px] uppercase text-text-tertiary">Low</span>
          <div className="flex h-2 w-28 rounded-full overflow-hidden border border-border-outline">
            {['#f0eded', '#dcefe0', '#7fb089', '#3d8f5c', '#007536'].map((c) => (
              <span key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="font-data text-[10px] uppercase text-text-tertiary">High</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0">
        <div className="p-md sm:p-lg bg-bg-app/40">
          {/* Decorative map — keyboard users use the ranked list (avoids nested interactive). */}
          <svg
            viewBox="0 0 400 320"
            className="w-full h-auto max-h-[320px]"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="0" y="0" width="400" height="320" fill="#fcf9f8" />
            <path d="M0 0 L400 0 L400 18 Q200 40 0 18 Z" fill="#d7ebe3" opacity="0.7" />
            {METRO_NEIGHBORHOODS.map((n) => {
              const stat = byId.get(n.id);
              const count = stat?.sessionCount ?? 0;
              const intensity = count / maxCount;
              const selected = selectedId === n.id;
              const hovered = hoveredId === n.id;
              return (
                <g key={n.id}>
                  <path
                    d={n.path}
                    fill={heatFill(intensity)}
                    stroke={selected || hovered ? '#1c1b1b' : '#ffffff'}
                    strokeWidth={selected || hovered ? 2.5 : 1.5}
                    className="cursor-pointer"
                    style={{ filter: hovered ? 'brightness(1.05)' : undefined }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectNeighborhood?.(selectedId === n.id ? null : n.id)}
                  />
                  <text
                    x={n.labelX}
                    y={n.labelY}
                    textAnchor="middle"
                    className="pointer-events-none"
                    fill={heatText(intensity)}
                    fontSize="9"
                    fontFamily="var(--font-ibm-plex-sans), monospace"
                    fontWeight="600"
                  >
                    {n.name.split(' ')[0]}
                  </text>
                  {count > 0 && (
                    <text
                      x={n.labelX}
                      y={n.labelY + 12}
                      textAnchor="middle"
                      className="pointer-events-none"
                      fill={heatText(intensity)}
                      fontSize="10"
                      fontFamily="var(--font-ibm-plex-sans), monospace"
                      fontWeight="700"
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="sr-only">
            Schematic metro map. Use the Top neighborhoods list to select a neighborhood filter.
          </p>
          {active && (
            <p className="mt-sm font-body text-[13px] text-text-tertiary" aria-live="polite">
              <span className="font-semibold text-text-primary">{active.name}</span>
              {' · '}
              {active.sessionCount} session{active.sessionCount === 1 ? '' : 's'}
              {' · '}
              {active.hours.toFixed(1)}h
              {active.underReview > 0 ? ` · ${active.underReview} under review` : ''}
            </p>
          )}
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-border-outline p-md sm:p-lg">
          <p
            id="top-neighborhoods-label"
            className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm"
          >
            Top neighborhoods
          </p>
          <ul className="flex flex-col gap-xs" role="list" aria-labelledby="top-neighborhoods-label">
            {ranked.map((n, i) => {
              const selected = selectedId === n.id;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNeighborhood?.(selected ? null : n.id)}
                    aria-pressed={selected}
                    aria-label={`${n.name}, ${n.sessionCount} sessions${selected ? ', selected' : ''}`}
                    className={`w-full min-h-11 px-sm py-xs rounded-sm flex items-center gap-sm text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      selected
                        ? 'bg-[#f7fff1] border border-primary/30'
                        : 'hover:bg-bg-surface-elevated border border-transparent'
                    }`}
                  >
                    <span className="font-data text-[12px] text-text-tertiary w-4" aria-hidden>
                      {i + 1}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: heatFill(n.sessionCount / maxCount) }}
                      aria-hidden
                    />
                    <span className="font-body text-[13px] font-medium text-text-primary flex-1 truncate">
                      {n.name}
                    </span>
                    <span className="font-data text-[12px] text-text-tertiary shrink-0">
                      {n.sessionCount}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedId && (
            <button
              type="button"
              onClick={() => onSelectNeighborhood?.(null)}
              className="mt-md min-h-11 font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2"
            >
              Clear neighborhood filter
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
