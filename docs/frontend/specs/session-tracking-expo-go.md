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
- [x] **AC-23:** Live tracker map layers control toggles Standard, Streets, Satellite, and Hybrid basemaps (Carto + Esri, no API key)
- [x] **AC-24:** GPS uses `BestForNavigation` at 1s interval with hardened capture filters (≤15m accuracy, ≥6m movement from last route point, accuracy-adaptive threshold, stationary detection via device speed, sharp-reversal rejection, 8s warm-up); stored route unchanged by display simplification
- [x] **AC-25:** Live map shows gray start marker and green heading arrow on EMA-smoothed `displayCoordinate`; preview maps show start + end markers on simplified route polyline
- [x] **AC-26:** Live tracker includes optional **Follow** toggle (default off); when on, map eases to smoothed position on each GPS update; Recenter still flies to current position independently

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
| `frontend/src/features/session-tracking/utils/mapStyles.ts` | Basemap layer definitions (standard, streets, satellite, hybrid) |
| `frontend/src/features/session-tracking/utils/routeFiltering.ts` | GPS capture filters, EMA display coordinate, Douglas-Peucker display simplification |
| `frontend/src/features/session-tracking/components/SessionMapMarkers.tsx` | Start, heading arrow, and end map markers |
| `frontend/src/features/session-tracking/components/LiveSessionMap.tsx` | Route Expo Go → WebView |
| `frontend/src/features/session-tracking/components/SessionRouteMapPreview.tsx` | Route Expo Go → WebView read-only |
| `frontend/src/app/_layout.tsx` | Ensure anon auth on app mount |

## Test plan

1. `cd frontend && npx expo install --check && npx expo start`
2. Open in **Expo Go** on a physical iPhone or Android device
3. Complete onboarding (or Log In shortcut) → Home
4. **Start Tracking** → session setup → permissions → **Start Session**
5. Walk outdoors ≥ 2 minutes; confirm WebView map shows route polyline and distance increments; toggle **Follow** to pan with you; drag to pan and pinch to zoom without map snapping back until follow is on or recenter is tapped
6. Submit a photo checkpoint; confirm camera capture works
7. **End Session** → submission confirmation shows photos + route preview; pan/zoom route preview inside scrollable screen
8. **Go Home** → session appears in Recent Sessions / Sessions list as Under Review
9. Force-quit app → reopen → session still visible (fetched from API)
10. Verify rows in Supabase `sessions` + `checkpoints` tables and objects in `session-photos` bucket
