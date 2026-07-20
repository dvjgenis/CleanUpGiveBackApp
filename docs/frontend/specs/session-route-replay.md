# Spec: Session route replay

**Date:** 2026-07-18  
**Status:** Implemented  
**Screens:** `/session-detail`, `/submission-confirmation`  
**Component:** `SessionRouteMapPanel`

## Summary

Completed sessions show an animated **route replay** on the walking-path map: Play advances the polyline over ~8 seconds, Pause holds progress, Replay restarts from the start. Works in Expo Go (WebView MapLibre) and EAS dev-client native MapLibre previews.

## User stories

- As a **volunteer**, I want to replay my cleanup route on session detail, so that I can review the path I walked.

## Acceptance criteria

- [x] **AC-1:** When a route has ≥ 2 GPS points, `SessionRouteMapPanel` shows icon **Play**, **Pause**, and **Replay** controls plus a synced `MM:SS / MM:SS` replay timer.
- [x] **AC-2:** Play animates partial polyline from start to end (~8s); end marker appears when complete.
- [x] **AC-3:** Pause stops animation at current progress; Play resumes from that point.
- [x] **AC-4:** Replay resets to start and plays again.
- [x] **AC-5:** Expo Go WebView uses `setRouteReplayProgress`; native MapLibre slices coordinates by progress.
- [x] **AC-6:** Animation has a **single RAF owner** — `startReplay` / Play only set `isPlaying`; the `isPlaying` effect schedules `requestAnimationFrame` (no double-RAF from effect + imperative start).

## Out of scope

- Live-session mid-track replay (during active tracking)
- Scrubber / timeline drag
- Speed controls

## Test plan

1. Complete a session with outdoor GPS → open submission confirmation or session detail.
2. Tap **Play** → route draws progressively; **Pause** → holds; **Replay** → restarts.
3. Confirm on Expo Go (WebView) and dev client (native) if available.
