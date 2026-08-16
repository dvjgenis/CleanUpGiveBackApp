# Spec: Home dashboard session stats

**Date:** 2026-07-18  
**Status:** Implemented  
**Route:** `/` (`HomeScreen`)  
**PRD:** §6.7 (Home dashboard)

## Summary

The Home dashboard Service Hours chart, total hours label, weekly-hours lime pill, and Your Impact grid derive from completed session data via `sessionStatsStore` (local snapshots + Fly API hydration), not static mocks.

## User stories

- As a **volunteer**, I want my service hours chart to update after I finish a session, so that I can see progress on the Home screen.
- As a **volunteer**, I want to browse other weeks in the chart picker and see real buckets for weeks where I logged sessions.
- As a **volunteer**, I want a one-tap **This week** control after browsing other weeks, so I can return to the current week without using the calendar modal.

## Acceptance criteria

- [x] **AC-1:** After **End Session** → **Go Home**, the current week’s bar chart and total hours reflect the completed session duration (hours bucketed by session start day, Monday-based week).
- [x] **AC-2:** `AuthProvider` hydrates stats from `GET /sessions` when the API is configured.
- [x] **AC-3:** Declined sessions are excluded from service hours; pending and approved count toward hours.
- [x] **AC-4:** Your Impact shows a two-line month summary matching Figma node `1328:142` (`In {month} {year}, you cleaned up` / `{n} place(s) for a total of {hours}.`, each row fixed to a single line — not a wrapping paragraph) with separate month and year dropdown chips (list-only picker — tap to choose; no type-to-search; all twelve months for the selected year; 100 calendar years newest-first through today, never later than the current year; gray pill background, centered label + chevron-down, edge-to-edge underline rule; places and hours highlighted in `colors.statusApprovedText` and update on change), plus a **Recent Cleanups** feed from `impactFeedStore` (map-first tiles: replay-style map preview as the main view, minimized progress photo top-left, Approved / Under Review badge top-right, title/time/duration overlay; tap opens session detail; **View All** → `/sessions-list`). Home does not show a Recent Sessions list (sessions live on `/sessions-list`). Empty `EmptyState` + **Log session?** when no photos yet. First-time Service Hours (0 lifetime hours) keeps the zero chart and adds “No service hours yet” + Track-button copy. Upcoming Events stays visible when empty. See [mobile-empty-states.md](mobile-empty-states.md).
- [x] **AC-5:** Week picker changes recompute chart data for the selected week (not empty mock bars).
- [x] **AC-7:** Recent Sessions **View All** navigates to `/sessions-list`.
- [x] **AC-8:** When the selected week is not the current Monday-based week, the trailing Week N badge is replaced by a **This week** chip; tap restores the current week (chart + total + labels). Chip uses quiet styling (`chipBg`, soft primary border, primary label) so it stays secondary to the date range control. On the current week, Week N shows as before.
- [x] **AC-9:** Weekly hours pill (shown when current-week hours > 0) uses lime fill + `textPrimary` 14px SemiBold (`N hour(s) this week. Keep it up!`, or minutes when the week total is under 1 hour), grouped as `accessibilityRole="text"` with the flame decorative. Does not use primary-green-on-lime (2.45:1 fail) or “streak” copy. Hours match the current-week Service Hours total at 0.1 hr precision (no integer `Math.round`). Service Hours week total and chart bar labels use **min** when under 1 hour.
- [x] **AC-10:** When the week max is under 1 hour (minute-scale chart), bar value labels like `18 min` / `12 min` render **above** the bar (not inside the narrow column), with a reserved **14px** label band at the top of the plot, `marginBottom: 4` between label and bar, centered text, and grid/Y-axis ticks aligned to the reduced plot height (`CHART_MINUTE_LABEL_BAND` in `HomeScreen.tsx`). Hour-scale weeks keep in-bar labels when the bar is tall enough (`barH > 20`).
- [ ] **AC-6:** Stacked approval-status bars (Approved / In Review / Not Approved) — deferred; v1 uses single green bar per day.

## Your Impact & Recent Cleanups (AC-4 detail)

**Component:** `frontend/src/features/figma-screens/components/ImpactFeedSection.tsx`  
**Data:** `sessionStatsStore` → month totals; `impactFeedStore` → Recent Cleanups tiles

### Impact sentence (replaces lifetime-hours hero)

Two fixed rows inside the white bordered card (`lifetimeHero`), matching Figma node `1328:142`:

| Row | Copy |
|-----|------|
| 1 | `In [month ▾] [year ▾], you cleaned up` — `heroRow` uses `flexWrap: 'nowrap'` |
| 2 | `{n} place(s) for a total of {hours}.` — place count + duration in `colors.statusApprovedText` (forest green semibold); trailing period stays body color |

- Month/year chips: `Pressable` pills (`chipSelectedBg`), `ChevronDownIcon`, edge-to-edge underline rule (`monthChipRule`).
- Totals recompute from `buildImpactMonthSummary(sessionStats, monthKey)` when month or year changes.
- Sub-hour durations use minutes (`36 minutes`, `1 hour`) via `formatImpactHoursPhrase` / `sessionFormat.ts`.

### Month / year picker sheet

Full-width bottom sheet (same motion as live tracker minimize / `MapTypesSheet`). **List-only since 2026-08-16** — no text search / **Go** row (12 months and 100 years are short enough to scroll).

| Behavior | Implementation |
|----------|----------------|
| Enter | Reanimated spring slide-up; scrim fades in (`modalEnter` + `easeOut`) |
| Dismiss | Sheet slides down (`sheetDismissSpring` + drawer easing); scrim fades; then unmount |
| Width | Edge-to-edge (`width: '100%'`, top corner radius only) |
| Selection | Scrollable `FlatList` only — tap a month or year row to apply and dismiss |
| Month list | All 12 months for the selected year (`buildImpactMonthOptionsForYear`) |
| Year list | 100 calendar years newest-first through today (`IMPACT_YEAR_SPAN`, `buildImpactYearOptions`); no future years |
| Scroll | Bounded `FlatList` (~82% screen max height); dismiss hit area is **above** the sheet only (`pickerDismissHit`) so list pans are not stolen |
| Initial scroll | Current selection scrolled into view; index `0` (current year) uses `scrollToOffset(0)` so **2026** is not clipped at open |

**Removed (2026-08-16):** `TextInput` + **Go** with `parseImpactMonthInput` / `parseImpactYearInput` — product decision to keep the sheet simple; parsing helpers stay in `homeDashboardStats.ts` for tests / future reuse but are not wired to this UI.

**Helpers** (`frontend/src/features/session-tracking/utils/homeDashboardStats.ts`):

- `buildImpactYearOptions`, `buildImpactMonthOptionsForYear`, `buildImpactMonthSummary`
- `formatImpactMonthSentence`, `formatImpactHoursPhrase`

**Tests:** `homeDashboardStats.test.ts` (year span, month summary; parse helpers tested but not used by picker UI).

### Recent Cleanups feed

Horizontal scroll of 220×220 tiles from `impactFeedStore` (local snapshots + API hydration):

| Layer | Role |
|-------|------|
| Background | Map always fills the tile (`SessionRouteMapPreview` native/Expo Go; `RoutePathThumbnail` on web). No full-bleed photo fallback. |
| Top-left | Small progress photo thumb (56×56, white border) when `imageUri` exists |
| Top-right | **Approved** / **Under Review** status badge |
| Bottom | Dark overlay — session title, date · time, duration |

- Tap tile → `/session-detail?id=…`
- **View All** → `/sessions-list`
- Empty → shared `EmptyState` + **Log session?** (see [mobile-empty-states.md](mobile-empty-states.md))

Home does **not** render a Recent Sessions list; sessions live on the Sessions tab.

## Out of scope

- PRD stacked bar chart by approval status (v1 single series)
- Returning-user preview mock (`HomeScreenReturningUser`) — still uses static Figma snapshot in PreviewApp

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `sessionStatsStore` | In-memory stats + AsyncStorage persistence + API hydration |
| `homeDashboardStats.ts` | Week chart aggregation + impact month/year helpers |
| `impactFeedStore.ts` | Recent Cleanups tiles (photos, route preview, status) |
| `sessionFormat.ts` | Sub-hour duration phrasing (`min` / `hours`) |
| `liveSessionStore.finalizeLiveSession` | Records local snapshot on session end |
| `recentSessionsStore` | Recent sessions list (separate from chart; Sessions tab only) |

## Test plan

1. Complete a tracked session → **Go Home** → confirm chart bar for today’s weekday increments and total hours updates.
2. Relaunch app with API configured → confirm hydrated sessions appear in chart.
3. Navigate to a prior week with no sessions → chart shows zeros; week with sessions shows bars.
4. From a non-current week, tap **This week** → date range, Week N (or chip hide), chart, and total hours return to the current week.
5. Log two sub-hour sessions in the same week (e.g. 18 min + 12 min) → chart switches to minute scale; bar labels sit above bars with spacing (not clipped inside columns or flush against the chart border).
6. **Your Impact** — tap month/year chips → sheet slides up full-width; scroll year list (100 years); current year fully visible at open; tap a month or year to update the sentence; months with no sessions show 0 places / 0 hours.
7. **Recent Cleanups** — after a session with GPS + progress photo, tile shows large map, small photo top-left, status badge, tap opens session detail; **View All** → sessions list.
