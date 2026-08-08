/**
 * Visual upgrade over the audit log's old single-line "field: from → to" list —
 * same `AuditChangeLine[]` data from `describeAuditChanges`, rendered as a
 * two-column Before/After grid so a multi-field change is scannable at a glance
 * instead of read line by line.
 *
 * Cell tint is driven by the *value's* tone (`fromTone`/`toTone`), not by which
 * column it's in — a blanket "before = red, after = green" made a "Declined"
 * status in the After column look identical to "Approved" (both green). Fields
 * with no inherent good/bad reading (hours, notes, dates, ...) stay untinted.
 */
import type { AuditChangeLine, AuditValueTone } from "@/lib/audit-log-summary";

const TONE_BG: Record<AuditValueTone, string> = {
  positive: "bg-[#f7fff1]",
  negative: "bg-[#ffd9de]",
  neutral: "bg-bg-surface-elevated",
};

export function AuditDiffCard({ changes }: { changes: AuditChangeLine[] }) {
  if (changes.length === 0) {
    return <span className="font-body text-[13px] text-text-tertiary">No field changes recorded</span>;
  }

  return (
    <div className="border border-border-outline rounded-sm overflow-hidden min-w-[220px]">
      <div className="grid grid-cols-[minmax(0,1fr)_1fr_1fr] bg-bg-surface-elevated">
        <span className="px-sm py-xs font-data text-[10px] font-medium tracking-[0.6px] text-text-tertiary uppercase" />
        <span className="px-sm py-xs font-data text-[10px] font-medium tracking-[0.6px] text-text-tertiary uppercase">
          Before
        </span>
        <span className="px-sm py-xs font-data text-[10px] font-medium tracking-[0.6px] text-text-tertiary uppercase">
          After
        </span>
      </div>
      <div className="divide-y divide-border-outline">
        {changes.map((c) => (
          <div key={c.label} className="grid grid-cols-[minmax(0,1fr)_1fr_1fr]">
            <span className="px-sm py-xs font-body text-[12px] text-text-tertiary truncate" title={c.label}>
              {c.label}
            </span>
            <span
              className={`px-sm py-xs font-body text-[12px] text-text-primary truncate ${c.fromTone ? TONE_BG[c.fromTone] : ""}`}
              title={c.from}
            >
              {c.from}
            </span>
            <span
              className={`px-sm py-xs font-body text-[12px] text-text-primary truncate ${c.toTone ? TONE_BG[c.toTone] : ""}`}
              title={c.to}
            >
              {c.to}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
