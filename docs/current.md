# Current state

What runs in the repo today.

## Runnable today

- **Expo app** in `frontend/` — Expo SDK 54, React Native 0.81, Expo Router
- **HTML prototype mode** — `frontend/src/app/prototype/[screen].tsx` renders Stitch HTML screens in a WebView with JS navigation bridge
- **Entry flow** — `frontend/src/app/index.tsx` mounts the native **Home dashboard** (`HomeScreen`, Figma `406:291`) in **first-time-user** mock state: empty service-hours chart (`0.0 hrs`, **current calendar week**), no streak badge, `0.0` impact stats, empty recent sessions with **"No recent sessions yet."** message until the user completes a session (**End Session** → `/submission-confirmation` → **Go Home** prepends that session to Recent Sessions via `recentSessionsStore`), **three** recent events, notification bell → `/notifications` (Figma `649:774`), live-session minimized bar when active, and 5-tab bottom nav. Populated returning-user snapshot preserved as `HomeScreenReturningUser` (preview via figma-screens `PreviewApp`). Session setup guide lives at `/session-setup` (and steps 2–7); **Start Tracking** opens the session setup form (Figma `260:1312`). **Start Session** validates required fields and navigates to `/live-session` (Figma `251:439`) — navbar location pill shows live city name and current °F from device GPS + Open-Meteo. **Submit Photo** → `/photo-checkpoint` → `/photo-capture` (selfie + progress photos, preview, submit) → `/photo-submitted` → **Continue Tracking** returns to `/live-session`. **End Session** → `/submission-confirmation` shows captured checkpoint photos with real timestamps, GPS walking-path map preview, live duration/date-time, and setup fields → **Go Home** returns to `/`. Missed-checkpoint at `/missed-checkpoint`. Motion follows Emil Kowalski rules (`frontend/src/motion/`, `design.md` §10): spring press on all touchables, screen-enter animations on Motion Inventory routes only. The HTML prototype remains at `/prototype/[screen]`.
- **Session Tracking feature slice** — `frontend/src/features/session-tracking/` implements PRD §6.9–6.15 (Setup → Permissions → Live Session → Photo Checkpoint → Session Review → Submission Confirmation, plus Missed Checkpoint and the Home-minimize interaction) end to end against mocked data, with a real `mapcn-react-native`/MapLibre map. Also includes a full Home dashboard (`HomeScreen`, Figma `406:291`: streak badge, service-hours chart, impact stats, recent sessions/events) hosting the minimized tracker bar. Not wired into `frontend/src/app/` — preview via its own `dev/PreviewApp.tsx` harness (see the feature's [README.md](../frontend/src/features/session-tracking/README.md)). Requires an EAS dev-client build to see the real map; falls back to a placeholder in Expo Go and on web.
- **Home dashboard (`frontend/src/features/figma-screens/screens/HomeScreen.tsx`)** — mounted at `/` with Figma-exact SVG icons, first-time-user mock data (`mocks/home.ts`), interactive week picker, and shared `BottomNavBar`. Empty states: no streak badge, `0.0` service hours chart, `0.0` impact stat cards, recent sessions header with **"No recent sessions yet."** until a session is ended (`recentSessionsStore` populated from `finalizeLiveSession`), **three** recent events. Returning-user populated copy: `HomeScreenReturningUser` + `mocks/home.returningUser.ts` (PreviewApp). When a live session is active (`liveSessionStore.isActive`), a minimized tracker bar shows live elapsed time, checkpoint countdown, distance, progress, and submitted-checkpoint dots + label only after at least one **early** checkpoint photo (`submittedEarly`); tapping expand navigates to `/live-session`. Live session back chevron minimizes to `/`.

## Design ground truth

- **Figma** is now the authoritative design source — [CleanUpGiveBack file](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) holds 7 flow pages (6 designed + 1 compliance spec), 46 manifest screens, and a Design System page (104 variables, 14 text styles).
- Local workspace: [`frontend/design/figma/`](../frontend/design/figma/README.md) — screen manifest, per-flow notes, token export placeholders.
- **Privacy & compliance** documented in [`docs/compliance/`](../docs/compliance/privacy-and-data-protection.md) — 13 new spec-only screens; existing screen changes pending approval.
- The Stitch/HTML pipeline is **frozen**. No new screens will be added to `HTML_MAP` or to Stitch.
- Migration is tracked per-screen in [`frontend/design/figma/manifest.yaml`](../frontend/design/figma/manifest.yaml): `designed` → `bound` → `implemented`.

## Not implemented yet

- Native RN screens replacing the HTML prototype in the main `frontend/src/app/` tree (migration in progress — see [`docs/frontend/specs/figma-to-native-handoff.md`](frontend/specs/figma-to-native-handoff.md)); the isolated Session Tracking slice above is a parallel exploration, not that migration
- Backend services under `backend/` (maps, payments, session tracking APIs)
- Real `expo-camera` wiring and a Session Detail screen (PRD §6.18); live tracker weather, GPS route, and distance are wired; backend persistence for routes still pending
- Production auth, payments, or persistence

## How to run

```bash
npm install --prefix frontend
npm start          # from repo root
# or: cd frontend && npx expo start
```

## Key paths

| Area | Path |
|------|------|
| App routes | `frontend/src/app/` |
| Bundled HTML screens | `frontend/assets/stitch/` *(legacy — frozen)* |
| Figma design workspace | `frontend/design/figma/` |
| Design exports (legacy) | `frontend/design/stitch_htmls/` |
| TS prototype (reference) | `frontend/prototype/` |
