# ADR-005: Live map in Expo Go via WebView

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Live session tracking shows a full-bleed map with a GPS route polyline on `/live-session` and read-only route previews on submission confirmation / session detail.

- **Native MapLibre** (`@maplibre/maplibre-react-native`) is configured in `app.json` and used in EAS dev-client builds via `LiveSessionMapNative.tsx`.
- **Expo Go** cannot load MapLibre — it is a native module not bundled in the Expo Go client. `LiveSessionMap.tsx` already detects `Constants.executionEnvironment === ExecutionEnvironment.StoreClient` and renders a static placeholder with GPS status text.
- **Web** uses a Metro `.web.tsx` stub; MapLibre native components crash `react-native-web` at import time.
- Test phase targets **Expo Go on a physical device** — no EAS build required yet. Testers need a **visible map with live route**, not only "GPS active · X.X mi tracked" text.

`react-native-webview` is already a dependency (`frontend/package.json`) and works in Expo Go.

## Decision

Add a **third map tier** for Expo Go:

| Runtime | Map implementation |
|---------|-------------------|
| Expo Go (iOS/Android) | `LiveSessionMapWebView` — WebView hosting MapLibre GL JS v4 from CDN, Carto Positron style |
| EAS dev-client / production native | Existing `LiveSessionMapNative` (MapLibre RN) — unchanged |
| Web | Existing placeholder (`ExpoGoMapFallback`) — unchanged |

### WebView map contract

- **Style:** `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` — same as native `defaultStyles.light` in `frontend/src/components/ui/map.tsx`.
- **Polyline color:** `colors.primary` (`#009540`) from session-tracking tokens.
- **Coordinates:** `[longitude, latitude]` — matches `RouteCoordinate` in `liveSessionStore` / `utils/geo.ts`; no axis flip.
- **Updates:** React Native pushes route + current position via `WebView.injectJavaScript` on `routeCoordinates`, `currentCoordinate`, and `mapRecenterToken` changes from `useLiveSession()`.
- **Read-only variant:** `SessionRouteMapPreviewWebView` for submission confirmation / session detail — `fitBounds` to recorded polyline, no live marker.

### Integration point

In `LiveSessionMap.tsx` and `SessionRouteMapPreview.tsx`, replace the single Expo Go fallback with:

```
isExpoGo → WebView map
Platform.OS === 'web' → placeholder
else → native MapLibre (lazy require)
```

## Consequences

- **Positive:** Real map tiles + live route in Expo Go without EAS build or Apple Developer account.
- **Positive:** Visual parity with native MapLibre (same Carto style and brand polyline).
- **Positive:** GPS tracking logic unchanged — only the rendering layer differs.
- **Negative:** Requires network for CDN (MapLibre GL JS) and Carto tiles — not offline-capable.
- **Negative:** Slight latency on `injectJavaScript` route updates; mitigated by existing `MIN_ROUTE_SAMPLE_METERS` throttling in `liveSessionStore`.
- **Follow-up:** Bundle MapLibre GL JS as a local asset if CDN reliability is a concern; native MapLibre remains the production path after EAS builds.

## Alternatives considered

- **Placeholder only in Expo Go** — rejected; testers cannot validate map UX.
- **Leaflet + OSM raster tiles** — simpler but uses `[lat, lng]` (coordinate flip) and different visual style from native MapLibre.
- **Google Maps WebView** — requires GCP API key; rejected per no-key map policy.
- **EAS dev-client build now** — valid long-term; deferred to reduce setup friction for Expo Go testing.
