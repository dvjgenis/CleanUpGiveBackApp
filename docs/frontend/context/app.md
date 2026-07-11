# Context: app

Expo Router navigation and screen entry points.

## Purpose

`frontend/src/app/` defines file-based routes. The app currently ships a **WebView HTML prototype** under `/prototype/[screen]`.

## Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `index.tsx` | Home dashboard (`HomeScreen`, Figma `406:291`) — **first-time-user** mock: empty chart (`0.0 hrs`), `0.0` impact stats, empty recent sessions with **"No recent sessions yet."** until a session is ended (`recentSessionsStore`); **three** recent events; bell opens `/notifications` |
| `/notifications` | `notifications.tsx` | Notification preferences (`NotificationsScreen`, Figma `649:774`) — toggle categories, back returns to home |
| `/session-setup-guide` | `session-setup-guide.tsx` | Session setup guide step 1 — "How does this work?" (Figma `session_setup_guide` intro); **Track** tab entry when no live session (always shown for now) |
| `/session-setup-step2` | `session-setup-step2.tsx` | Session setup guide step 2 |
| `/session-setup-step3` | `session-setup-step3.tsx` | Session setup guide step 3 — "Time is ticking..." (Figma `229:351`) |
| `/session-setup-step4` | `session-setup-step4.tsx` | Session setup guide step 4 — "Checkpoint photos for verification." (Figma `249:369`) |
| `/session-setup-step5` | `session-setup-step5.tsx` | Session setup guide step 5 — "Now that the session is over..." (Figma `249:387`) |
| `/session-setup-step6` | `session-setup-step6.tsx` | Session setup guide step 6 — location permission (Figma `728:639` / `permission-location`); **Enable location** calls `expo-location` `requestForegroundPermissionsAsync()` (iOS/Android system dialog) |
| `/session-setup-step7` | `session-setup-step7.tsx` | Session setup guide step 7 — camera permission (Figma `728:658` / `permission-camera`); **Enable camera** calls `expo-camera` `requestCameraPermissionsAsync()` (iOS/Android system dialog) |
| `/session-setup-complete` | `session-setup-complete.tsx` | Session setup finale — "That's it! Let's get tracking!" (Figma `251:405`) |
| `/session-setup` | `session-setup.tsx` | Session setup form (Figma `260:1312` / PRD §6.9) |
| `/live-session` | `live-session.tsx` | Live session tracker (Figma `251:439` / PRD §6.11); back chevron minimizes to `/`; location pill shows live city + temperature via `expo-location` + Open-Meteo; GPS route + distance via `liveSessionStore` + MapLibre map (dev client); checkpoint card shows submitted photo count + green dots only when at least one photo was submitted **before** the 30-minute countdown expired (`submittedEarly`) |
| `/photo-checkpoint` | `photo-checkpoint.tsx` | Photo checkpoint prompt (Figma `364:115` / PRD §6.12) — **Take Photo** opens `/photo-capture` |
| `/photo-capture` | `photo-capture.tsx` | Two-step camera capture: front-camera selfie → back-camera progress photo → BeReal-style preview (Figma `383:239`: full-bleed progress + top-left selfie PiP + **Retake Photos** / **Submit**) → `/photo-submitted` |
| `/photo-submitted` | `photo-submitted.tsx` | Photo submitted confirmation (Figma `260:1571` / PRD §6.12) — hero animation inside the bordered card (`PhotoSubmittedHeroVideo`); resets checkpoint countdown on mount, live `MM:SS` timer ticks until **Continue Tracking**; shows session photo count only when the just-submitted photo was taken early (before countdown hit zero) |
| `/submission-confirmation` | `submission-confirmation.tsx` | Session detail / submission confirmation (Figma `269:1615` / PRD §6.15) — reads `getCompletedSessionSnapshot()` for **all** checkpoint photos (selfie + progress per submission), tap any thumbnail for enlarged view, timestamps, route map preview, duration, and setup fields |
| `/missed-checkpoint` | `missed-checkpoint.tsx` | Missed checkpoint error (Figma `269:1587` / PRD §6.13) — hero Lottie loops continuously |
| `/prototype/[screen]` | `prototype/[screen].tsx` | Renders Stitch HTML by screen key |
| Layout | `_layout.tsx` | Root `Stack` with explicit `Stack.Screen` entries for native session routes + prototype |

## Patterns

- **Track tab** (`BottomNavBar` on home + notifications): active live session → `/live-session`; otherwise → `/session-setup-guide` (full guide flow through permissions, then `/session-setup` form)
- **Guide navigation:** Continue uses `router.push`; Previous/back use `router.back()` (reverse swipe). Step 6 Previous uses `router.replace('/session-setup-step5')` with `animationTypeForReplace: 'pop'` when Skip bypasses the stack.
- **NAV_RULES** + injected JS bridge handle cross-screen navigation via `postMessage`
- Metro bundles `.html` via `frontend/metro.config.js` (`assetExts` includes `html`)
- Asset loading: `expo-asset` + `expo-file-system` with fetch fallback

## Decisions

- Stack navigator over `NativeTabs` so `/prototype/*` routes are reachable (see [progress.md](../../progress.md))
- `injectedJavaScriptBeforeContentLoaded` + `onMessage` for iOS WKWebView navigation

## Policies

- **Do not add new screens to the prototype.** New screens are registered in `frontend/design/figma/manifest.yaml` and implemented as native RN routes under `src/app/`.
- The HTML prototype (`/prototype/[screen]`) is **frozen** — it continues to run for Expo Go demos but receives no new features.
- Native production screens live under `src/app/<routeKey>.tsx` following Expo Router file-based conventions. Use the `routeKey` from `manifest.yaml` as the filename.
- When a native screen ships, set its `status` to `implemented` in `manifest.yaml` and remove its entry from `HTML_MAP`.
