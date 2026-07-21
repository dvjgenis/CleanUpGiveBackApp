# Spec: Home dashboard session stats

**Date:** 2026-07-18  
**Status:** Implemented  
**Route:** `/` (`HomeScreen`)  
**PRD:** §6.7 (Home dashboard)

## Summary

The Home dashboard Service Hours chart, total hours label, weekly streak badge, and Your Impact grid derive from completed session data via `sessionStatsStore` (local snapshots + Fly API hydration), not static mocks.

## User stories

- As a **volunteer**, I want my service hours chart to update after I finish a session, so that I can see progress on the Home screen.
- As a **volunteer**, I want to browse other weeks in the chart picker and see real buckets for weeks where I logged sessions.

## Acceptance criteria

- [x] **AC-1:** After **End Session** → **Go Home**, the current week’s bar chart and total hours reflect the completed session duration (hours bucketed by session start day, Monday-based week).
- [x] **AC-2:** `AuthProvider` hydrates stats from `GET /sessions` when the API is configured.
- [x] **AC-3:** Declined sessions are excluded from service hours; pending and approved count toward hours.
- [x] **AC-4:** Impact stats (miles, locations, sessions, photos) derive from the same `sessionStatsStore`; **Photos Submitted** uses API `photoCount` / `checkpointCount * 2` on cold start (merge prefers higher `photoCount` when IDs collide).
- [x] **AC-5:** Week picker changes recompute chart data for the selected week (not empty mock bars).
- [x] **AC-7:** Recent Sessions **View All** navigates to `/sessions-list`.
- [ ] **AC-6:** Stacked approval-status bars (Approved / In Review / Not Approved) — deferred; v1 uses single green bar per day.

## Out of scope

- PRD stacked bar chart by approval status (v1 single series)
- Returning-user preview mock (`HomeScreenReturningUser`) — still uses static Figma snapshot in PreviewApp

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `sessionStatsStore` | In-memory stats + AsyncStorage persistence + API hydration |
| `homeDashboardStats.ts` | Aggregation helpers |
| `liveSessionStore.finalizeLiveSession` | Records local snapshot on session end |
| `recentSessionsStore` | Recent sessions list (separate from chart) |

## Test plan

1. Complete a tracked session → **Go Home** → confirm chart bar for today’s weekday increments and total hours updates.
2. Relaunch app with API configured → confirm hydrated sessions appear in chart.
3. Navigate to a prior week with no sessions → chart shows zeros; week with sessions shows bars.
