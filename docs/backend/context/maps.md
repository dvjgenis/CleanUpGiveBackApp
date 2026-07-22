# Context: maps

Map and location services for live session tracking.

## Purpose

Powers route display, GPS sampling, and distance stats during cleanup sessions. Geolocation is **client-owned** for v1; the sessions API persists the finalized route polyline on session end.

**Map rendering:** [ADR-005](../../adr/ADR-005-expo-go-webview-map.md)  
**Persistence:** [sessions.md](sessions.md) / [sessions-api.md](../specs/sessions-api.md)  
**Frontend spec:** [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md) (AC-24, AC-32–34)

## Responsibilities

### Client (implemented)

- GPS sampling during **active** sessions via `liveSessionStore`:
  - Foreground: `expo-location` `watchPositionAsync` at `BestForNavigation` (**1 s / ~1 m** for active sessions) — started immediately after When-In-Use grant so the live map (which waits for a GPS seed) cannot stall behind Always permission or a hanging one-shot fix
  - Initial seed: `getLastKnownPositionAsync` + timed Balanced `getCurrentPositionAsync` (8s) in parallel with the watch; Always / background enablement is also non-blocking
  - Background (EAS only): `expo-task-manager` task while session active + Always permission granted (**1 s / ~1 m**); stops on finalize/cancel; re-asserted on foreground resume if updates stopped
  - Pipeline: **2D Kalman** (`locationKalman.ts`) → hardened gates (Kalman-resolved accuracy ≤**25 m**, adaptive min-move `max(1m, accuracy×0.25)`, stationary ignores `speedMps===0` and uses route-gap distance, sharp-reversal, **3 s** warm-up, 30s gap recovery); foreground/background sample dedupe; soft subscription stop on mid-session watch restart (Kalman + append timestamps preserved); `displayRouteCoordinates` + tip refreshed every fix; WebView ensures GeoJSON **line layer** (not source-only)
- Rich in-memory samples `{lng, lat, accuracy, speed, heading, t}`; API finalize still sends `[[lng, lat], …]`
- Route display: live tracker uses `simplifyRouteForLiveDisplay()` (~**1 m** + raw tail); previews/replay use `simplifyRouteForDisplay()` (~4 m); maps may append EMA tip segment (`appendLiveTipToDisplayRoute`); stored distance/route uses capture-filtered points only
- Live map markers: primary-green heading-beam on EMA-smoothed `displayCoordinate` only (no start pin — it stacked on the tip for short walks); heading from device compass (`watchHeadingAsync`, adaptive EMA + platform accuracy gate, ~33 ms publish), GPS course fallback; live tracker **My Location** (flyTo + optional follow ~**280 ms** ease)
- Live maps wait for first GPS fix (“Getting precise location…”) before mounting the basemap (no US overview flash)
- When Always/background unavailable (`backgroundLocationEnabled === false`), session still starts foreground-only; **`AppState` active** → `resumeLiveSessionTrackingAfterForeground()` restarts GPS watch
- Completed-session replay: `sliceRouteByDistanceProgress` (distance-scaled ~3–10s animation on detail/confirmation maps)
- Live weather + reverse geocoding via [Open-Meteo](https://open-meteo.com/) — `useLiveWeather.ts`
- Location plugins in `app.json`: when-in-use + Always strings; `isIosBackgroundLocationEnabled` / `isAndroidBackgroundLocationEnabled`

### Map rendering (three tiers)

| Runtime | Component | Tiles |
|---------|-----------|-------|
| Expo Go | `LiveSessionMapWebView` | MapLibre GL JS (CDN); Standard light/dark (Carto Voyager / Dark Matter via `mapThemeStore`), Satellite (Esri), Hybrid (Esri + transportation/labels) — wired to `liveSessionStore.mapLayer` |
| EAS dev-client / native | `LiveSessionMapNative` | MapLibre RN + same layer/theme options |
| Web | Placeholder fallback | N/A |

Read-only route previews: `SessionRouteMapPreview` (+ WebView variant) with Play / Pause / Replay via `SessionRouteMapPanel` (length-scaled ~3–10s; auto-play respects `useReducedMotion`).

### Server (implemented via sessions API)

- Store finalized route as jsonb `[[lng, lat], …]` on `PATCH /sessions/:id/finalize`
- No real-time GPS streaming to server in v1
- No separate `backend/maps/` microservice for v1

### Deferred

- Geofence validation for checkpoint zones
- Google Maps / Mapbox provider abstraction
- Mid-session route PATCH (still finalize-only)

## Integrations

- **Map tiles:** Carto Voyager / Dark Matter (Standard) and Esri World Imagery (Satellite / Hybrid) via MapLibre — no API key ([accounts-and-access.md](../../accounts-and-access.md))
- **Weather:** Open-Meteo — no API key
- **Frontend:** `expo-location`, `expo-task-manager`, `react-native-webview` (Expo Go map), `@maplibre/maplibre-react-native` (native builds)
- **Backend:** route persistence via sessions API only

## Policies

- No Google Cloud Maps API key required for session tracking v1
- GPS collected only during **active** sessions (foreground + optional background while session active; Always permission on iOS/Android)
- Route data subject to retention policy in [privacy-and-data-rights.md](../specs/privacy-and-data-rights.md)
- Esri raster sources (Satellite / Hybrid) are capped at `maxzoom: 19` in `mapStyles.ts`. Esri's tile service returns a "Map data not available" placeholder image (not a 404) for tiles past its real coverage, so MapLibre can't fall back on its own — the cap makes MapLibre stop fetching past that level and over-zoom (upscale) the last real tile instead.

## Decisions

- **2026-07-21 — GPS trail precision:** ~1 m capture, soft subscription stop on mid-session resume (preserve Kalman), motion gating in append filters only (not watch throttling). See [progress.md](../../progress.md) (“GPS trail precision and continuity”).
- **2026-07-21 — Outdoor trail restore:** resolved-accuracy 25 m, ignore `speedMps===0` for stationary, WebView line-layer re-ensure, distance UI hundredths &lt; 0.1 mi. Expo Go foreground trail confirmed; EAS + Always still open. See [progress.md](../../progress.md) (“Fix live GPS trail”).

## Related

- Code: `frontend/src/features/session-tracking/liveSessionStore.ts`, `backgroundLocationTask.ts`, `components/LiveSessionMap*.tsx`, `utils/geo.ts`, `utils/routeFiltering.ts`, `utils/locationKalman.ts`
- `backend/maps/` — scaffold only; folded into sessions domain for v1
- Frontend spec: [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)
