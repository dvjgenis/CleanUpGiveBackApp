# Context: app

Expo Router navigation and screen entry points.

## Purpose

`frontend/src/app/` defines file-based routes. The app currently ships a **WebView HTML prototype** under `/prototype/[screen]`.

## Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `index.tsx` | Entry / redirect |
| `/prototype/[screen]` | `prototype/[screen].tsx` | Renders Stitch HTML by screen key |
| Layout | `_layout.tsx` | Root `Stack`, `headerShown: false` |

## Patterns

- **HTML_MAP** in `[screen].tsx` maps screen keys to `require()` of `frontend/assets/stitch/*.html`
- **NAV_RULES** + injected JS bridge handle cross-screen navigation via `postMessage`
- Metro bundles `.html` via `frontend/metro.config.js` (`assetExts` includes `html`)
- Asset loading: `expo-asset` + `expo-file-system` with fetch fallback

## Decisions

- Stack navigator over `NativeTabs` so `/prototype/*` routes are reachable (see [progress.md](../../progress.md))
- `injectedJavaScriptBeforeContentLoaded` + `onMessage` for iOS WKWebView navigation

## Policies

- New prototype screens: add HTML to `frontend/assets/stitch/`, register key in `HTML_MAP`, add NAV_RULES as needed
- Production screens should live as RN components under `src/app/` when replacing HTML prototype
