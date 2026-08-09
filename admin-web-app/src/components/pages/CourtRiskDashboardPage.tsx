"use client";

/**
 * At-risk court dashboard — every court-ordered volunteer with days-to-deadline,
 * hours progress, 30-day invalid-session count, and near-deadline session-volume
 * spike, sourced from `loadCourtRiskDashboard()`. Sortable/filterable by severity.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import type { CourtRiskDashboardRow } from "@/lib/live-data";

type StatusFilter = "all" | "at_risk" | "in_progress" | "completed";

const STATUS_LABELS: Record<CourtRiskDashboardRow["status"], string> = {
  at_risk: "At risk",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_TONE: Record<CourtRiskDashboardRow["status"], string> = {
  at_risk: "bg-[#ffd9de] text-[#ba1a1a]",
  in_progress: "bg-[#fff2c9] text-[#8a6300]",
  completed: "bg-[#f7fff1] text-[#007536]",
};

/** Due within this many days gets the strongest visual treatment in the Deadline column. */
const CRITICAL_WINDOW_DAYS = 5;

function daysToDeadlineLabel(dueDate: string, now: Date): string {
  if (!dueDate) return "No due date";
  const days = differenceInCalendarDays(new Date(dueDate), now);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

/** Pill styling for the Deadline column — a 3-step severity ladder so overdue reads as
 * strictly worse than "due within 5 days", which in turn reads as worse than the calmer
 * amber used for the rest of the at-risk window. Solid dark red > light red > amber > gray. */
function deadlineTone(dueDate: string, now: Date): string {
  if (!dueDate) return "text-text-tertiary";
  const days = differenceInCalendarDays(new Date(dueDate), now);
  if (days < 0) {
    return "bg-[#ba1a1a] text-white font-semibold px-sm py-xs rounded-sm w-fit";
  }
  if (days < CRITICAL_WINDOW_DAYS) {
    return "bg-[#ffd9de] text-[#ba1a1a] font-semibold px-sm py-xs rounded-sm w-fit";
  }
  if (days <= 14) {
    return "bg-[#fff2c9] text-[#8a6300] font-semibold px-sm py-xs rounded-sm w-fit";
  }
  return "text-text-tertiary";
}

export function CourtRiskDashboardPage({ rows }: { rows: CourtRiskDashboardRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("at_risk");
  const now = useMemo(() => new Date(), []);

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    const aDays = a.dueDate ? differenceInCalendarDays(new Date(a.dueDate), now) : Infinity;
    const bDays = b.dueDate ? differenceInCalendarDays(new Date(b.dueDate), now) : Infinity;
    return aDays - bDays;
  });

  const atRiskCount = rows.filter((r) => r.status === "at_risk").length;

  return (
    <div className="max-w-6xl mx-auto p-xl">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">At-Risk Court Dashboard</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          {atRiskCount} court-ordered volunteer{atRiskCount !== 1 ? "s" : ""} at risk of missing their deadline.
        </p>
      </header>

      <div className="flex items-center gap-xs mb-lg flex-wrap" role="group" aria-label="Filter by status">
        {(["at_risk", "in_progress", "completed", "all"] as StatusFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={statusFilter === value}
            onClick={() => setStatusFilter(value)}
            className={`h-9 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
              statusFilter === value
                ? "bg-primary text-white border-primary"
                : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
            }`}
          >
            {value === "all" ? "All" : STATUS_LABELS[value]} (
            {value === "all" ? rows.length : rows.filter((r) => r.status === value).length})
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1.5fr_7rem_9rem_8rem_8rem_6rem] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {[
            { label: "Volunteer" },
            { label: "Deadline" },
            { label: "Hours" },
            {
              label: "Missed checkpoints",
              title:
                "Sessions in the last 30 days that were auto-invalidated for missing a required selfie/progress checkpoint — not necessarily fraud, but worth a look.",
            },
            { label: "Late rush" },
            { label: "Status" },
          ].map((col) => (
            <span
              key={col.label}
              title={col.title}
              className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary"
            >
              {col.label}
            </span>
          ))}
        </div>
        {sorted.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No volunteers match this filter.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {sorted.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/volunteers/${r.id}`}
                  className="grid grid-cols-1 lg:grid-cols-[1.5fr_7rem_9rem_8rem_8rem_6rem] gap-xs lg:gap-md lg:items-center px-lg py-md hover:bg-bg-surface-elevated transition-colors no-underline text-inherit"
                >
                  <p className="font-body text-[14px] font-medium text-text-primary truncate">{r.name}</p>
                  <span
                    className={`font-data text-[13px] whitespace-nowrap ${deadlineTone(r.dueDate, now)}`}
                  >
                    {r.dueDate ? daysToDeadlineLabel(r.dueDate, now) : "No due date"}
                  </span>
                  <span className="font-data text-[13px] text-text-primary whitespace-nowrap">
                    {r.completedHours.toFixed(1)} / {r.requiredHours}h
                  </span>
                  <span className={`font-data text-[13px] whitespace-nowrap ${r.invalidSessionsLast30Days > 0 ? "text-[#ba1a1a]" : "text-text-tertiary"}`}>
                    {r.invalidSessionsLast30Days}
                  </span>
                  <span
                    className="font-data text-[13px] whitespace-nowrap"
                    title="Several sessions logged in the 14 days before the deadline — may mean hours are being rushed in at the last minute rather than completed steadily."
                  >
                    {r.nearDeadlineVolumeSpike ? (
                      <span className="font-semibold text-[#ba1a1a]">Rushed</span>
                    ) : (
                      <span className="text-text-tertiary">Steady</span>
                    )}
                  </span>
                  <span className={`font-data text-[11px] font-semibold px-sm py-xs rounded-sm uppercase w-fit ${STATUS_TONE[r.status]}`}>
                    {STATUS_LABELS[r.status]}
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
