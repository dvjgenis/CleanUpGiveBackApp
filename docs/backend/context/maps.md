# Context: maps

Map and location services for live session tracking.

## Purpose

Powers route display, GPS sampling, and distance stats during cleanup sessions. Geolocation is **client-owned** for v1; the sessions API persists the finalized route polyline on session end.

**Map rendering:** [ADR-005](../../adr/ADR-005-expo-go-webview-map.md)  
**Persistence:** [sessions.md](sessions.md) / [sessions-api.md](../specs/sessions-api.md)

## Responsibilities

### Client (implemented)

- GPS sampling during active sessions via `liveSessionStore` (`expo-location` `watchPositionAsync` at `BestForNavigation`, 1s interval, hardened capture filters: ≤15m accuracy, ≥6m from last route point, stationary detection, sharp-reversal rejection, 8s warm-up)
- Route display simplification via `simplifyRouteForDisplay()` (outlier removal + Douglas-Peucker + light smooth; map only; stored distance uses capture-filtered raw points)
- Live map markers: gray start point, green heading arrow on EMA-smoothed `displayCoordinate`; optional Follow toggle pans map on GPS updates
- Location watching stops when session ends (`endLiveSession`)
- Live weather + reverse geocoding via [Open-Meteo](https://open-meteo.com/) (no API key) — `useLiveWeather.ts`
- Foreground location permission via `expo-location` plugin in `app.json`

### Map rendering (three tiers)

| Runtime | Component | Tiles |
|---------|-----------|-------|
| Expo Go | `LiveSessionMapWebView` (planned) | MapLibre GL JS + Carto Positron (CDN); layer picker: Standard, Streets, Satellite (Esri), Hybrid (Esri + labels) |
| EAS dev-client / native | `LiveSessionMapNative` | MapLibre RN + same layer options |
| Web | Placeholder fallback | N/A |

Read-only route previews: `SessionRouteMapPreview` (+ planned WebView variant for Expo Go).

### Server (planned)

- Store finalized route as jsonb `[[lng, lat], …]` on `PATCH /sessions/:id/finalize`
- No real-time GPS streaming to server in v1
- No separate `backend/maps/` microservice for test phase

### Deferred

- Geofence validation for checkpoint zones
- Google Maps / Mapbox provider abstraction
- Background location tasks (explicitly out of scope — session-only foreground tracking per privacy baseline)

## Integrations

- **Map tiles:** Carto Positron via MapLibre — no API key ([accounts-and-access.md](../../accounts-and-access.md))
- **Weather:** Open-Meteo — no API key
- **Frontend:** `expo-location`, `react-native-webview` (Expo Go map), `@maplibre/maplibre-react-native` (native builds)
- **Backend:** route persistence via sessions API only

## Policies

- No Google Cloud Maps API key required for session tracking v1
- GPS collected only during active sessions (foreground, when-in-use permission)
- Route data subject to retention policy in [privacy-and-data-rights.md](../specs/privacy-and-data-rights.md)

## Related

- Code: `frontend/src/features/session-tracking/liveSessionStore.ts`, `components/LiveSessionMap.tsx`, `utils/geo.ts`, `utils/routeFiltering.ts`
- `backend/maps/` — scaffold only; folded into sessions domain for v1
- Frontend spec: [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)
