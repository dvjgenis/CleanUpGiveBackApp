# Current state

What runs in the repo today.

## Runnable today

- **Admin portal** in `admin/` — Next.js 15 on **http://localhost:3001** (`npm run dev` in `admin/`); home is a **bento Today** (Review hero + metric tiles + court; Insights collapsed); see [`docs/admin/ux-audit-2026-07-22.md`](admin/ux-audit-2026-07-22.md) and [`docs/admin/chart-types-2026-07-22.md`](admin/chart-types-2026-07-22.md); WCAG notes in [`docs/admin/a11y-audit-2026-07-22.md`](admin/a11y-audit-2026-07-22.md)
- **Expo app** in `frontend/` — Expo SDK 54, React Native 0.81, Expo Router
- **HTML prototype mode** — `frontend/src/app/prototype/[screen].tsx` renders Stitch HTML screens in a WebView with JS navigation bridge
- **Entry flow** — Splash → `/welcome` → create-account → `/creating-account` (2 facts, ~7.5s) → account-phone (**full legal name** + phone; accuracy notice) → account-details (birthday; **COPPA `age < 13` clears onboarding PII and routes to `/under-age`**; court acceptance + nighttime ban) → permissions → tour. Home greeting uses legal name from store. Recent events use mock location-mapped remote image URIs. **Register** on event detail emails confirmation when API+Resend configured. Account: company code upgrades tracker (removes free-hour countdown); footer © + 501(c)(3) nonprofit message; **Give Feedback** → `/give-feedback`. Personal details: email-only with OTP. Export: court mandated → approved-only. Session start: form → selfie/progress → live. **End session:** end photos → `/submission-confirmation` (optional **Share Feedback** → `/session-feedback` → `/feedback-thank-you` → back to confirmation). Sessions list: Select + multi-status mocks for bulk delete.
- **Session Tracking** — Production routes under `frontend/src/app/` import `liveSessionStore` + map/checkpoint components from `frontend/src/features/session-tracking/` (GPS, `expo-camera`, Fly API, WebView maps in Expo Go / native MapLibre in EAS). The folder also keeps a **legacy mock** `dev/PreviewApp.tsx` harness for isolated UI review (see the feature's [README.md](../frontend/src/features/session-tracking/README.md)).
- **Home dashboard (`frontend/src/features/figma-screens/screens/HomeScreen.tsx`)** — mounted at `/` with Figma-exact SVG icons, interactive week picker, and shared `BottomNavBar`. Service Hours chart, total hours, streak badge, and Your Impact stats derive from `sessionStatsStore` (local snapshots on session end + Fly API hydration); recent sessions from `recentSessionsStore`. Empty states until first session ends. Recent Sessions **View All** opens `/sessions-list`. **Three** recent events (tap opens `/event-detail`). Returning-user populated copy: `HomeScreenReturningUser` + `mocks/home.returningUser.ts` (PreviewApp). **Sessions** tab opens `/sessions-list` (Figma `515:1791`); **Profile** tab opens `/account`. When a live session is active (`liveSessionStore.isActive`), a minimized tracker pill (`LiveSessionMinimizedPill`) shows live elapsed time, checkpoint countdown, distance, an animated checkpoint progress fill, and submitted-checkpoint dots + label only after at least one **early** checkpoint photo (`submittedEarly`); expand (top-right chevron or Track tab) slides the pill down while `/live-session` opens with a bottom-up map reveal wipe; returning to Home slides the pill back up. Live session back chevron (down) minimizes via immediate `dismissTo('/')` (session keeps running; pill stays on Home).
- **Event detail (`/event-detail`)** — native `EventDetailScreen` (Figma `events_detail`, `196:226`): hero image carousel, badges, overview, organizer, what to bring; copy icon copies Maps link with toast; location section shows a live MapLibre pin preview (WebView in Expo Go, native in dev-client; Maps CTA on web) and opens Apple Maps (iOS) / Google Maps (Android) on tap; **Add to calendar** via `expo-calendar` (Apple/Google Calendar or device calendar on Android); **Register** shows `EventRegistrationSuccessModal` (Figma `787:406`); **Go Home** returns to `/`.
- **Shop (`/shop`)** — native `ShopScreen` (Figma `498:606`): donate card, featured kit, filters, product grid; **Add to cart** → empty-by-default `cartStore`; cart badge = live qty; empty cart icon tap shows toast; cart icon → `/cart` when items exist.
- **Donate (`/donate`)** — native `DonateScreen` (Figma `412:4` / PRD §6.20): Contribute top bar, impact card, amount presets + custom; **Continue** → `/purchase-confirmation?mode=donation&amount=` (donation receipt).
- **Product detail (`/product-detail`)** — native `ProductDetailScreen`: qty + **Add to cart** → `cartStore`; empty-cart toast on cart icon; cart badge live.
- **Cart (`/cart`)** — native `CartScreen`: line items + donation from shared `cartStore` (default **$5**); **Continue** → `/checkout`.
- **Checkout (`/checkout`)** — native `CheckoutScreen`: order summary from `cartStore`; Place Order validates required fields with red highlights + missing-fields toast; empty-cart toast on cart icon; **Place Order** → `/purchase-confirmation`.
- **Purchase confirmation (`/purchase-confirmation`)** — order mode lists cart lines; donation mode (`?mode=donation`) shows gift-only receipt + “Total Gift”; hearts animate on enter.
- **Sessions list (`/sessions-list`)** — native `SessionsScreen` (Figma `sessions_list___hybrid_redesign`, `515:1791`): search bar, All / Approved / Under Review / Declined chips, sort dropdown with **Select** on the same row; refetches on focus from Fly API when `EXPO_PUBLIC_API_URL` is set (loading/empty/error states); when API is unset, shows filtered local mock rows; **Select** mode for bulk hard delete of non-approved sessions; row tap opens `/session-detail?id=` (when not selecting).
- **Shop home (`/shop`)** — native `ShopScreen` (Figma `shop_home`, `498:606` / PRD §6.19): mission copy, donate card ($5/$10/$15/Custom), featured Trash Clean Up Kit ($29.99), category chips, 2-column product grid (Kit $29.99 under Kits/All; Tote $3 / Grabber $23.99 / Child Vest $9.99 / Adult Vest $12.99); Shop tab active; Home/Account/Sessions nav wired to `/shop`.
- **Session detail (`/session-detail`)** — native `SessionDetailScreen` (Figma `session_detail`, `515:1848`): `useSessionDetail` fetches from Fly API + signed Supabase Storage photo URLs; walking-path map via `SessionRouteMapPanel` + `useSessionRouteCoordinates` with icon **Play / Pause / Replay** controls and synced replay timer; auto-replays once on load (skipped when reduced motion is enabled) on the basemap layer selected when the session ended (`CompletedSessionSnapshot.mapLayer`); pan/zoom when route exists; status badge, title/date/address, hours/miles/photos stats, shared `SessionPhotosSection` **Photos** carousel matching post-session confirmation (horizontal selfie/progress thumbs with time pills; tap → full-screen enlarge); read-only **Description** (setup text) and editable **Notes** (500-char limit with live counter, persisted locally via `sessionNotesStore` — editable when revisiting from Sessions list). **Delete session** (non-approved only) calls `DELETE /sessions/:id` when synced and clears local recent/cache/stats + AsyncStorage tombstones; removes the row from admin review.
## Design ground truth

- **Figma** is now the authoritative design source — [CleanUpGiveBack file](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) holds 7 flow pages (6 designed + 1 compliance spec), 46 manifest screens, and a Design System page (104 variables, 14 text styles).
- Local workspace: [`frontend/design/figma/`](../frontend/design/figma/README.md) — screen manifest, per-flow notes, **token JSON** in [`tokens/`](../frontend/design/figma/tokens/).
- Runtime tokens: [`frontend/src/constants/tokens.ts`](../frontend/src/constants/tokens.ts) (canonical); `theme.ts` chrome + feature `tokens.ts` re-exports consume it.
- **Privacy & compliance** documented in [`docs/compliance/`](../docs/compliance/privacy-and-data-protection.md) — COPPA under-13 block with signup PII wipe; universal highest-privacy defaults (opt-in notifications, no teen tier); additional Figma compliance screens designed but not all shipped.
- The Stitch/HTML pipeline is **frozen**. No new screens will be added to `HTML_MAP` or to Stitch.
- Migration is tracked per-screen in [`frontend/design/figma/manifest.yaml`](../frontend/design/figma/manifest.yaml): `designed` → `bound` → `implemented`.

## Sessions + geolocation (implemented — Expo Go test phase)

- **Supabase anonymous auth** on app launch via `AuthProvider` in `_layout.tsx` (`frontend/src/lib/supabase.ts`)
- **Fly sessions API** client (`frontend/src/lib/api.ts`, `sessionsApi.ts`) — persists create/checkpoint/finalize when `EXPO_PUBLIC_API_URL` is set
- **GPS + camera** live in Expo Go via `liveSessionStore` (`expo-location` BestForNavigation at **1 s / ~1 m**; 2D Kalman position filter; route append gated on **Kalman-resolved accuracy ≤ 25 m**; stationary gate ignores `speedMps === 0` (common on iOS while walking) and uses distance from last route point; foreground/background dedupe; hardened capture filters — min-move `max(1m, accuracy×0.25)`, slow-walk friendly stationary gate, gap recovery, sharp-reversal rejection; mid-session foreground resume preserves Kalman via soft subscription stop; device-compass heading with adaptive EMA + platform accuracy gating and GPS fallback; EMA-smoothed live arrow; live tracker **My Location** control (flyTo + optional follow ~280 ms); **`displayRouteCoordinates` + live tip refreshed every fix**; WebView MapLibre line layer re-ensured each update (`layout` line-join/cap); distance UI shows hundredths under 0.1 mi; lighter live display simplify (~1 m + tail) + tip segment on live maps; **session detail / confirmation replay** uses the same **`simplifyRouteForLiveDisplay`** (not 4 m preview simplify); Douglas-Peucker on legacy 4 m paths where still referenced; live maps wait for first GPS fix with “Getting precise location…” instead of US overview flash). **Live session draft** persists to AsyncStorage while active; **Resume/Discard** on cold start via `LiveSessionResumeGate`. **Background GPS** during active sessions via `expo-task-manager` when Always location is granted (EAS dev build required; **Expo Go is foreground-only** — GPS restarts when the app returns to foreground and re-asserts background task when Always granted; route gaps while locked/backgrounded are expected in Expo Go)
- **WebView map** in Expo Go (MapLibre GL JS + Carto Voyager / Dark Matter) per ADR-005; user pan/zoom on live and preview maps; live tracker map layer picker (Standard / Satellite / Hybrid) wired to `liveSessionStore.mapLayer`; Standard light/dark theme via `mapThemeStore` (auto by local time 7pm–6am, Account toggle to follow time of day, live sun/moon tool to override); **tracker UI chrome** (timer/location/tools/checkpoint/CTAs/Map Types) follows the same theme via `trackerChromeTheme.ts`; dark theme repaints parks/nature reserves/green landcover a legible dark green (upstream Dark Matter renders them invisible against the near-black background — see `mapStyles.ts`); weather pill uses Open-Meteo `weather_code` icons; native MapLibre unchanged for EAS builds
- **Sessions list** refetches from Fly API on focus when `EXPO_PUBLIC_API_URL` is set — loading/empty/error states; when API is unset, shows filtered mock rows; **Select** → bulk delete non-approved sessions (AsyncStorage tombstones keep deleted ids hidden across restarts)
- **Session detail** fetches from Fly API + Supabase Storage signed URLs via `useSessionDetail`; volunteers can **Delete session** when status is not `approved` (`DELETE /sessions/:id` + `removeVolunteerSession` clears recent/cache/stats + AsyncStorage tombstones); after delete, returns to `/sessions-list` with row removed
- **Checkpoint grace** — **5 minutes** after a due checkpoint (`CHECKPOINT_MISS_GRACE_MS`) before invalid finalize / `/missed-checkpoint`
- **Backend:** Fastify + Prisma in `backend/sessions/` — deployed to `https://cleanup-sessions.fly.dev`; uses Supabase Postgres + JWKS (ES256) auth verification
- **GPS trail QA:** Outdoor Expo Go walk confirmed green polyline + distance increments after stationary-gate / WebView layer / distance-format fixes (2026-07-21). EAS + Always lock-screen continuity still open.
- **Checkpoint / finalize sync:** Client **recreates remote session once and retries** on Fly `404 Active session not found` for both checkpoints (`ensureRemoteSession`) and finalize (`createRemoteSessionFromSetup` — works after local teardown). Mid-session sync failures set `sessionSyncWarning`, shown as a banner on `/live-session` (cleared on successful checkpoint sync). Fill `frontend/.env` with **project root** Supabase URL (no `/rest/v1/`) and **anon public JWT** — see [supabase.md](supabase.md). Restart Metro after `.env` changes. Residual 404s usually mean API/env mismatch — see [expo-go-eas-tester-runbook.md](frontend/specs/expo-go-eas-tester-runbook.md).
- **Feedback** — `/session-feedback` (post-session) and `/give-feedback` (Account) share `FeedbackScreen` (rating row **Very Sad → Excited**); Submit → `/feedback-thank-you` (`dismissTo` confirmation or Account). Rating/text are UI-only today (not persisted to an API).

**API:** `EXPO_PUBLIC_API_URL=https://cleanup-sessions.fly.dev` in `frontend/.env`. Backend needs `DATABASE_URL` + `SUPABASE_URL` on Fly.

## Not implemented yet

- Supabase dashboard: enable Anonymous auth + run `sql/supabase-init.sql` storage policies if bucket missing (verify if not done)
- Production auth (email OTP), Stripe, admin approval UI
- Detach unused Fly Managed Postgres cluster (`cleanup-sessions-db`) if provisioned during `fly launch` — app uses Supabase Postgres

## How to run

```bash
npm install --prefix frontend
npm start              # smart: hotspot → LAN; else tunnel (cellular / guest Wi‑Fi)
npm run start:lan      # same Wi‑Fi (fast)
npm run start:hotspot  # Mac on iPhone Personal Hotspot → LAN
npm run start:device   # force tunnel (phone on LTE/5G)
```

Full matrix and troubleshooting: [expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md).

**Physical device (Expo Go):**

| Phone connection | Command |
|------------------|---------|
| Same Wi‑Fi as Mac | `npm run start:lan` |
| Mac on iPhone hotspot (`172.20.10.x`) | `npm start` or `npm run start:hotspot` |
| Phone on cellular, Mac on Wi‑Fi | `npm run start:device` |

Metro clears inherited `CI=true` so fast refresh stays enabled. If tunnel/ngrok times out, the start script prints recovery commands.

### EAS development build (background GPS + native MapLibre)

See [accounts-and-access.md](accounts-and-access.md). After installing a development build: `cd frontend && npm run start:dev-client`. **Rebuild required** after `app.json` / `expo-task-manager` plugin changes. Checkpoint photos use **`expo-camera`** in both Expo Go and the dev client.

## Key paths

| Area | Path |
|------|------|
| App routes | `frontend/src/app/` |
| Bundled HTML screens | `frontend/assets/stitch/` *(legacy — frozen)* |
| Figma design workspace | `frontend/design/figma/` |
| Design exports (legacy) | `frontend/design/stitch_htmls/` |
| TS prototype (reference) | `frontend/prototype/` |
