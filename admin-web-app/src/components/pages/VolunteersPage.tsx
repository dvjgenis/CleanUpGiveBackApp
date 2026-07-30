"use client";

/**
 * Faithful port of the real admin Users page (`admin/app/(admin)/users/page.tsx`
 * + `UsersClientShell.tsx`) — this is what web-app's "Volunteers" nav item
 * renders, since admin merged Volunteers + Court Hours into `/users`.
 *
 * `users` is fetched live from the shared Supabase Auth directory + `sessions`
 * + `court_orders` by `admin-web-app/src/app/volunteers/page.tsx` (and `/users`)
 * (see `@/lib/live-data`'s `loadLiveUsers`), falling back to an illustrative
 * mock roster when the service-role key isn't configured yet.
 */
import { useState } from "react";
import Link from "next/link";
import { CourtBadge } from "@/components/ui/CourtBadge";
import { UserPreviewDrawer, type UserRow } from "@/components/ui/UserPreviewDrawer";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { formatDate, MOCK_COURT_AT_RISK } from "@/lib/mock-data";

const DEFAULT_USERS: UserRow[] = [
  ...MOCK_COURT_AT_RISK.map((v) => ({
    id: v.id,
    name: v.name,
    email: v.email,
    phone: null,
    sessions: v.sessions,
    totalHours: v.completedHours,
    courtOrdered: true,
    lastActive: "2026-07-20T00:00:00Z",
    joinedAt: "2026-01-15T00:00:00Z",
    requiredHours: v.requiredHours,
    completedHours: v.completedHours,
  })),
  { id: "u1", name: "Alex Chen", email: "alex.c@email.com", phone: null, sessions: 12, totalHours: 48.5, courtOrdered: false, lastActive: "2026-07-18T00:00:00Z", joinedAt: "2025-11-02T00:00:00Z", requiredHours: null, completedHours: null },
  { id: "u2", name: "Luna Martinez", email: "luna.m@email.com", phone: null, sessions: 15, totalHours: 60.2, courtOrdered: false, lastActive: "2026-07-21T00:00:00Z", joinedAt: "2025-09-14T00:00:00Z", requiredHours: null, completedHours: null },
  { id: "u3", name: "Miguel Santos", email: "miguel.s@email.com", phone: null, sessions: 9, totalHours: 34.0, courtOrdered: false, lastActive: "2026-07-10T00:00:00Z", joinedAt: "2026-02-01T00:00:00Z", requiredHours: null, completedHours: null },
];

const FILTERS: { value: "all" | "court" | "voluntary"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "court", label: "Court-ordered" },
  { value: "voluntary", label: "Voluntary" },
];

function ProgressBar({ pct }: { pct: number }) {
  const clipped = Math.min(100, pct);
  const color = pct >= 100 ? "#007536" : pct >= 60 ? "#5a8f3a" : pct >= 30 ? "#835400" : "#ba1a1a";
  return (
    <div className="w-24 bg-bg-surface-elevated rounded-full h-1.5 overflow-hidden shrink-0">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${clipped}%`, backgroundColor: color }} />
    </div>
  );
}

export function VolunteersPage({ users = DEFAULT_USERS, isMock = false }: { users?: UserRow[]; isMock?: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "court" | "voluntary">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const total = users.length;
  const courtOrderedCount = users.filter((u) => u.courtOrdered).length;
  const atRiskCount = users.filter(
    (u) => u.courtOrdered && u.requiredHours != null && u.completedHours != null && u.completedHours < u.requiredHours,
  ).length;
  const totalHours = users.reduce((sum, u) => sum + u.totalHours, 0);

  const needle = q.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (filter === "court" && !u.courtOrdered) return false;
    if (filter === "voluntary" && u.courtOrdered) return false;
    if (!needle) return true;
    return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle);
  });

  const previewUser = previewId ? (users.find((u) => u.id === previewId) ?? null) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-md gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Users</h1>
        <button
          type="button"
          className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-xs"
        >
          Export CSV
        </button>
      </div>

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        {[
          { label: "Total Users", value: total },
          { label: "Court-Ordered", value: courtOrderedCount },
          { label: "At Risk", value: atRiskCount, color: atRiskCount > 0 ? "text-[#ba1a1a]" : undefined },
          { label: "Combined Hours", value: `${totalHours.toFixed(0)}h` },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
              {stat.label}
            </p>
            <p className={`font-data text-[28px] font-semibold ${stat.color ?? "text-text-primary"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-sm mb-lg lg:flex-row lg:flex-wrap lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full lg:w-64 lg:max-w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface font-body text-[14px] placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:shrink-0"
        />
        <div className="flex items-center gap-xs min-w-0 max-w-full overflow-x-auto pb-0.5" role="group" aria-label="Filter by volunteer type">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="lg:ml-auto font-body text-[14px] text-text-tertiary self-start lg:self-center shrink-0">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1.5fr_7.5rem_6.5rem_4.5rem_11rem_7.5rem] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {["Name", "Joined", "Sessions", "Hours", "Type / Progress", "Last Active"].map((col) => (
            <span
              key={col}
              className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                col === "Name" ? "text-left" : "text-center"
              }`}
            >
              {col}
            </span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No users match this search.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {filtered.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/volunteers/${u.id}`}
                  className="grid grid-cols-1 lg:grid-cols-[1.5fr_7.5rem_6.5rem_4.5rem_11rem_7.5rem] gap-xs lg:gap-md lg:items-center px-lg py-md hover:bg-bg-surface-elevated transition-colors no-underline text-inherit"
                  aria-label={`View volunteer profile for ${u.name}`}
                >
                  <div className="min-w-0">
                    <p className="font-body text-[14px] font-medium text-text-primary hover:text-primary">{u.name}</p>
                    <p className="font-body text-[12px] text-text-tertiary">{u.email}</p>
                  </div>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Joined </span>
                    {u.joinedAt ? formatDate(u.joinedAt) : "—"}
                  </span>
                  <span className="font-data text-[13px] font-medium text-text-primary lg:text-center">
                    {u.sessions} session{u.sessions !== 1 ? "s" : ""}
                  </span>
                  <span className="font-data text-[13px] font-medium text-primary lg:text-center">
                    {u.totalHours.toFixed(1)}h
                  </span>
                  {u.courtOrdered ? (
                    <div className="flex items-center gap-sm lg:justify-center min-w-0">
                      <CourtBadge />
                      {u.requiredHours != null && u.completedHours != null && (
                        <>
                          <ProgressBar pct={(u.completedHours / u.requiredHours) * 100} />
                          <span className="font-data text-[11px] text-text-tertiary whitespace-nowrap">
                            {u.completedHours.toFixed(1)}/{u.requiredHours}h
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="lg:flex lg:justify-center">
                      <span className="font-data text-[11px] font-semibold px-sm py-xs rounded-sm bg-[#f7fff1] text-primary whitespace-nowrap w-fit">
                        Voluntary
                      </span>
                    </div>
                  )}
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Last active </span>
                    {u.lastActive ? formatDate(u.lastActive) : "Never"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UserPreviewDrawer user={previewUser} open={previewId != null} onClose={() => setPreviewId(null)} />
    </div>
  );
}
