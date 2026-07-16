# Spec: Session tracking — Expo Go test phase

**Date:** 2026-07-13  
**Status:** Draft — engineering requirements (implementation shipped 2026-07-13; Fly deploy pending)  
**ADR:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md), [ADR-005](../../adr/ADR-005-expo-go-webview-map.md)  
**Backend:** [sessions-api.md](../../backend/specs/sessions-api.md)  
**PRD:** §6.9–6.15 (session setup through submission confirmation)

## Summary

Wire the existing native session tracking flow (`frontend/src/app/` routes + `liveSessionStore`) to Supabase anonymous auth, Fly sessions API persistence, and a WebView MapLibre map so testers can exercise the full geolocation + sessions loop in **Expo Go** on a physical device — no EAS dev-client build required.

## User stories

- As a **tester**, I want to start a cleanup session without signing in, so that I can validate tracking quickly.
- As a **tester**, I want to see my live GPS route on a map while walking, so that I can confirm geolocation tracking works.
- As a **tester**, I want to submit photo checkpoints during a session, so that evidence is captured and stored.
- As a **tester**, I want my completed session to persist after I close the app, so that I can confirm backend integration works.
- As a **tester**, I want to see my session in the sessions list with status **Under Review**, so that the post-session lifecycle is visible.

## Acceptance criteria

### Auth

- [x] **AC-1:** On first launch, app calls `supabase.auth.signInAnonymously()` silently (no login screen)
- [x] **AC-2:** Supabase session persists across app restarts via `@react-native-async-storage/async-storage` + `react-native-url-polyfill`

### Geolocation (client — already wired, verify in Expo Go)

- [x] **AC-3:** `expo-location` foreground permission prompt on session start
- [x] **AC-28:** Session Setup's **Required Permissions** Location/Camera toggles default to **on** when the OS has already granted those permissions (via onboarding or the session-setup-guide prompts), read via `isSessionLocationPermissionGranted`/`isSessionCameraPermissionGranted` (`getForegroundPermissionsAsync`/`Camera.getCameraPermissionsAsync`, no prompt) on mount; toggles still default to off and remain user-editable when permission was declined
- [x] **AC-29:** Session-setup-guide's `/session-setup-step6` (location) and `/session-setup-step7` (camera) "Allow …?" screens check current grant status on mount and auto-`replace` forward to the next step when already granted (e.g. granted earlier during onboarding), instead of re-showing a redundant ask screen
- [x] **AC-30:** Account → Permissions Camera/Location toggles (`AccountScreen.tsx`) mirror the real OS grant status (re-checked on focus); turning a toggle on calls the real permission request (shows the native iOS prompt only if that permission has never been decided — expected iOS behavior); turning one off (or on when already denied) cannot revoke/grant an OS permission from inside the app, so the switch snaps back to the actual status and an alert offers **Open Settings** (`Linking.openSettings()`)
- [x] **AC-31:** Onboarding's `/notification-preference` **Enable notifications** button fires the real `expo-notifications` `requestPermissionsAsync()` (native iOS prompt) before continuing to `/setup-complete`; Account → Permissions gets a third **Notifications** toggle following the exact same mirror-OS-status / request-on-enable / Open-Settings-on-disable pattern as Camera/Location
- [x] **AC-4:** `liveSessionStore` accumulates route polyline and distance via `watchPositionAsync` during active session
- [x] **AC-5:** Location watching stops when session ends (`endLiveSession`)
- [x] **AC-6:** 30-minute checkpoint countdown runs; missed checkpoint navigates to `/missed-checkpoint`

### Map (Expo Go WebView — to implement)

- [x] **AC-7:** Expo Go renders `LiveSessionMapWebView` with Carto Positron tiles and primary-color route polyline
- [x] **AC-8:** Map updates live as `routeCoordinates` and `currentCoordinate` change in `liveSessionStore`
- [x] **AC-9:** Recenter control triggers `requestLiveSessionMapRecenter()` → map re-centers on current position
- [x] **AC-10:** Submission confirmation and session detail use read-only WebView route preview with `fitBounds`
- [x] **AC-11:** Native MapLibre path unchanged for future EAS builds; web keeps placeholder
- [x] **AC-22:** Live and preview maps support user pan and pinch zoom; live map recenters only on first GPS fix, when follow mode is enabled, or when recenter is tapped; preview `fitBounds` runs once on initial load
- [x] **AC-23:** Live tracker map layers control toggles Standard, Satellite, and Hybrid basemaps (Carto Voyager + Esri, no API key); `MapTypesSheet` selection is wired to `liveSessionStore.mapLayer` so the basemap actually updates on tap
- [x] **AC-24:** GPS uses `BestForNavigation` at 1s interval with hardened capture filters (≤15m accuracy, ≥6m movement from last route point, accuracy-adaptive threshold, stationary detection via device speed, sharp-reversal rejection, 8s warm-up); stored route unchanged by display simplification
- [x] **AC-25:** Live map shows gray start marker and a primary-green heading-beam dot (white halo, fading directional beam) on EMA-smoothed `displayCoordinate`; beam heading is driven by the device compass (`watchHeadingAsync`, EMA-smoothed) so it tracks which way the phone is facing in real time, falling back to GPS course-over-ground while the compass is unavailable; preview maps show start + end markers on simplified route polyline
- [x] **AC-26:** Live tracker includes optional **Follow** toggle (default off); when on, map eases to smoothed position on each GPS update; Recenter still flies to current position independently
- [x] **AC-27:** Submission confirmation and session detail route previews auto-play a one-shot "replay" animation on load — the polyline grows from start to end with a moving tip marker over a distance-scaled duration (~1.8–3.5s), then settles into the static start/end marker view identical to today; replay does not repeat on re-render, respects `useReducedMotion` (skips straight to the static view), and re-running it (e.g. switching basemap layer) shows the static route rather than replaying again; the basemap opens on the layer the user had selected when the session ended (`CompletedSessionSnapshot.mapLayer` → `SessionRouteMapPanel.initialMapLayer`), not always Standard

### Camera (client — already wired, verify in Expo Go)

- [x] **AC-12:** `expo-camera` permission prompt; selfie (front) + progress (back) capture on `/photo-capture`
- [x] **AC-13:** Submitted photos appear on submission confirmation with real timestamps

### Persistence (to implement)

- [x] **AC-14:** `startNewLiveSession()` → `POST /sessions` via Fly API; stores returned `sessionId` in store state
- [x] **AC-15:** `addPhotoCheckpoint()` → upload selfie + progress to Supabase Storage `session-photos`, then `POST /sessions/:id/checkpoints`
- [x] **AC-16:** `finalizeLiveSession()` → `PATCH /sessions/:id/finalize` with route, duration, distance; status `under_review`
- [x] **AC-17:** Sessions list fetches from `GET /sessions` (replacing or merging with mock data for test phase)
- [x] **AC-21:** Submission confirmation **DURATION** matches **DATE & TIME** range — duration derived from `startedAt`/`endedAt` wall clock (not a stale tick counter); backend finalize recomputes `durationSeconds` server-side
- [ ] **AC-18:** Completed session survives app kill + reopen (requires Fly deploy + `EXPO_PUBLIC_API_URL`)

### Environment

- [x] **AC-19:** `frontend/.env` holds `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` per [supabase.md](../../supabase.md)
- [x] **AC-20:** `frontend/.env.example` updated with Supabase + API URL placeholders (Firebase entries marked legacy)

## Out of scope

- EAS dev-client / production native MapLibre builds
- Google Cloud Maps API key
- Stripe payments
- Admin approval UI (manual status change in Supabase for test)
- Email OTP / account linking
- Background GPS (session-only foreground tracking per privacy baseline)
- Real-time GPS streaming to server during session (batch on finalize only for v1)

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@supabase/supabase-js` | Auth + Storage client |
| `@react-native-async-storage/async-storage` | Persist Supabase auth session |
| `react-native-url-polyfill` | Supabase fetch compatibility |
| `react-native-webview` | Expo Go map (already installed) |
| Fly sessions API | [sessions-api.md](../../backend/specs/sessions-api.md) |
| Supabase project | [supabase.md](../../supabase.md) |

### Code touchpoints

| File | Change |
|------|--------|
| `frontend/src/lib/supabase.ts` | New — Supabase client + anon sign-in |
| `frontend/src/lib/api.ts` | New — Fly API fetch wrapper with JWT |
| `frontend/src/features/session-tracking/liveSessionStore.ts` | Wire create/checkpoint/finalize to API |
| `frontend/src/features/session-tracking/components/LiveSessionMapWebView.tsx` | New — WebView map for Expo Go |
| `frontend/src/features/session-tracking/components/MapInteractionContainer.tsx` | Touch responder wrapper for map pan/zoom inside ScrollViews |
| `frontend/src/features/session-tracking/utils/mapStyles.ts` | Basemap layer definitions (standard, satellite, hybrid) |
| `frontend/src/features/session-tracking/utils/routeFiltering.ts` | GPS capture filters, EMA display coordinate, Douglas-Peucker display simplification |
| `frontend/src/features/session-tracking/components/SessionMapMarkers.tsx` | Start, heading-beam dot, and end map markers |
| `frontend/src/features/session-tracking/components/LiveSessionMap.tsx` | Route Expo Go → WebView |
| `frontend/src/features/session-tracking/components/SessionRouteMapPreview.tsx` | Route Expo Go → WebView read-only |
| `frontend/src/features/session-tracking/components/SessionRouteMapPreviewWebView.tsx` | `replayOnce` prop — one-shot growing-polyline + tip-marker replay via `window.replayRoute`; initial HTML style is baked from `mapLayer` so Hybrid/Satellite open without a post-load `setStyle` race |
| `frontend/src/features/session-tracking/components/SessionRouteMapPanel.tsx` | Threads `replayOnce` to preview; `showLayerControl` (default `true`) toggles the basemap layer-picker button — session detail hides it; `initialMapLayer` opens the replay on the layer the session ended with |
| `frontend/src/app/_layout.tsx` | Ensure anon auth on app mount |
| `frontend/src/utils/sessionPermissions.ts` | Added `isSessionLocationPermissionGranted`/`isSessionCameraPermissionGranted` status checks (no OS prompt); camera request/check now goes through the `Camera` legacy object per `expo-camera` 17 |
| `frontend/src/screens/SessionSetupFormScreen.tsx` | Location/Camera permission toggles default from actual OS-granted status on mount |
| `frontend/src/screens/SessionSetupStep6Screen.tsx`, `SessionSetupStep7Screen.tsx` | Check grant status on mount; auto-`replace` to the next step when already granted instead of re-prompting |
| `frontend/src/features/figma-screens/screens/AccountScreen.tsx` | Permissions toggles (Camera, Location, **Notifications**) mirror real OS status (`useFocusEffect`); on-toggle calls real request/status check; off-toggle (or already-denied on-toggle) reverts the switch and alerts with an Open Settings action |
| `frontend/src/utils/notificationPermissions.ts` | New — `requestSessionNotificationPermission`/`isSessionNotificationPermissionGranted` via `expo-notifications` (creates an Android notification channel first, required for the OS prompt to appear on Android 13+) |
| `frontend/src/screens/NotificationPreferenceScreen.tsx` | **Enable notifications** now calls `requestSessionNotificationPermission()` (real OS prompt) before continuing, matching the location/camera onboarding screens |
| `frontend/app.json` | Added `expo-notifications` plugin |

## Test plan

1. `cd frontend && npx expo install --check && npx expo start`
2. Open in **Expo Go** on a physical iPhone or Android device
3. Complete onboarding (or Log In shortcut) → Home
4. **Start Tracking** → session setup → permissions → **Start Session**
5. Walk outdoors ≥ 2 minutes; confirm WebView map shows route polyline and distance increments; toggle **Follow** to pan with you; drag to pan and pinch to zoom without map snapping back until follow is on or recenter is tapped
6. Submit a photo checkpoint; confirm camera capture works
7. **End Session** → submission confirmation shows photos + route preview; route preview auto-replays the walking path once (growing line + moving tip marker) before settling into the static view; pan/zoom route preview inside scrollable screen
8. **Go Home** → session appears in Recent Sessions / Sessions list as Under Review; opening that session's detail screen replays the same walking-path animation once per visit
9. Force-quit app → reopen → session still visible (fetched from API)
10. Verify rows in Supabase `sessions` + `checkpoints` tables and objects in `session-photos` bucket
