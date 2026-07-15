# Current state

What runs in the repo today.

## Runnable today

- **Expo app** in `frontend/` — Expo SDK 54, React Native 0.81, Expo Router
- **HTML prototype mode** — `frontend/src/app/prototype/[screen].tsx` renders Stitch HTML screens in a WebView with JS navigation bridge
- **Entry flow** — `frontend/src/app/index.tsx` shows `AppSplashScreen` (solid `color/primary`; single logo + title fill bottom-up via cover wipe, then fade) then routes to `/welcome` (Figma `112:6776`) until onboarding is marked complete (`onboardingStore`). Onboarding screens import shared `figma-screens/tokens` (notif chips use `chipBg` `#f0edec`; tour mint `bgTour` `#dcebe2`; cream `textOnPrimarySoft` on tour Continue). **Log In** marks onboarding complete and opens home. Create-account → `/creating-account` (Figma `137:73`, rotating Did-you-know facts + progress bar) → account-phone → account-details → `/location-permission` (Figma `725:553`) → `/camera-permission` (Figma `725:613`) → notification-preference → `/setup-complete` (Figma `133:93`) **Continue** marks onboarding complete and starts the native tour: `/home-tour` (`137:527`) → `/shop-tour` (`137:115`) → `/track-tour` (`137:431`) → `/session-tour` (`137:173`, native search + tilted session rows with lime stars on approved) → `/set-tour` (`112:7170`, speckled lime stars with staggered fade-in) with **Go Home** → `/`, **Start Tracking** → `/session-setup-guide`, **Replay tour** → `/home-tour`. Home dashboard (`HomeScreen`, Figma `406:291`) is in **first-time-user** mock state: empty service-hours chart (`0.0 hrs`, **current calendar week**), no streak badge, `0.0` impact stats, empty recent sessions with **"No recent sessions yet."** message until the user completes a session (**End Session** → `/submission-confirmation` → **Go Home** prepends that session to Recent Sessions via `recentSessionsStore`), **three** recent events (tap → `/event-detail`, Figma `196:226`; **Register** → confirmation overlay Figma `787:406`), notification bell → `/notifications` (Figma `649:774`), **Shop** tab → `/shop` (Figma `498:606`), **Profile** tab → `/account` (Figma `569:896`; Export Service Record → `/export-service-record` Figma `854:383` → success `/export-record-success` Figma `840:561`; Approval History → `/approval-history` Figma `854:294`; Order History → `/order-history` Figma `854:116`; Donation History → `/donation-history` Figma `854:205`; Delete Account → `/delete-account-confirm` Figma `725:361`), live-session minimized bar when active, and 5-tab bottom nav. Under-18 birthday on account-details → `/under-age` (Figma `728:901`; **Learn why** → `/under-age-learn-why` Figma `833:314`). Populated returning-user snapshot preserved as `HomeScreenReturningUser` (preview via figma-screens `PreviewApp`). Session setup guide lives at `/session-setup` (and steps 2–7); **Start Tracking** opens the session setup form (Figma `260:1312`). **Start Session** validates required fields and navigates to `/live-session` (Figma `251:439`) — navbar location pill shows live city name and current °F from device GPS + Open-Meteo; **layers** opens a UI-only Map Types sheet (Standard / Satellite / Hybrid; selection not wired to the basemap yet). **Submit Photo** → `/photo-checkpoint` → `/photo-capture` (selfie + progress photos, preview, submit) → `/photo-submitted` → **Continue Tracking** returns to `/live-session`. **End Session** → `/submission-confirmation` shows captured checkpoint photos with real timestamps, GPS walking-path map preview, live duration/date-time, and setup fields → **Go Home** returns to `/`. Missed-checkpoint at `/missed-checkpoint`. Motion follows Emil Kowalski rules (`frontend/src/motion/`, `design.md` §10): spring press on all touchables, screen-enter animations on Motion Inventory routes only. The HTML prototype remains at `/prototype/[screen]`.
- **Session Tracking feature slice** — `frontend/src/features/session-tracking/` implements PRD §6.9–6.15 (Setup → Permissions → Live Session → Photo Checkpoint → Session Review → Submission Confirmation, plus Missed Checkpoint and the Home-minimize interaction) end to end against mocked data, with a real `mapcn-react-native`/MapLibre map. Also includes a full Home dashboard (`HomeScreen`, Figma `406:291`: streak badge, service-hours chart, impact stats, recent sessions/events) hosting the minimized tracker bar. Not wired into `frontend/src/app/` — preview via its own `dev/PreviewApp.tsx` harness (see the feature's [README.md](../frontend/src/features/session-tracking/README.md)). Requires an EAS dev-client build to see the real map; falls back to a placeholder in Expo Go and on web.
- **Home dashboard (`frontend/src/features/figma-screens/screens/HomeScreen.tsx`)** — mounted at `/` with Figma-exact SVG icons, first-time-user mock data (`mocks/home.ts`), interactive week picker, and shared `BottomNavBar`. Empty states: no streak badge, `0.0` service hours chart, `0.0` impact stat cards, recent sessions header with **"No recent sessions yet."** until a session is ended (`recentSessionsStore` populated from `finalizeLiveSession`), **three** recent events (tap opens `/event-detail`). Returning-user populated copy: `HomeScreenReturningUser` + `mocks/home.returningUser.ts` (PreviewApp). **Sessions** tab opens `/sessions-list` (Figma `515:1791`); **Profile** tab opens `/account`. When a live session is active (`liveSessionStore.isActive`), a minimized tracker pill (`LiveSessionMinimizedPill`) shows live elapsed time, checkpoint countdown, distance, an animated checkpoint progress fill, and submitted-checkpoint dots + label only after at least one **early** checkpoint photo (`submittedEarly`); expand (top-right chevron or Track tab) slides the pill down while `/live-session` opens with a bottom-up map reveal wipe; returning to Home slides the pill back up. Live session back chevron minimizes to `/`.
- **Event detail (`/event-detail`)** — native `EventDetailScreen` (Figma `events_detail`, `196:226`): hero image carousel, badges, overview, organizer, what to bring; copy icon copies Maps link with toast; location map (no static placeholder) opens Apple Maps (iOS) / Google Maps (Android) on tap; **Register** shows `EventRegistrationSuccessModal` (Figma `787:406`); **Go Home** returns to `/`.
- **Shop (`/shop`)** — native `ShopScreen` (Figma `498:606`): donate card, featured kit, filters, product grid; **Add to cart** → empty-by-default `cartStore`; cart badge = live qty; empty cart icon tap shows toast; cart icon → `/cart` when items exist.
- **Donate (`/donate`)** — native `DonateScreen` (Figma `412:4` / PRD §6.20): Contribute top bar, impact card, amount presets + custom; **Continue** → `/purchase-confirmation?mode=donation&amount=` (donation receipt).
- **Product detail (`/product-detail`)** — native `ProductDetailScreen`: qty + **Add to cart** → `cartStore`; empty-cart toast on cart icon; cart badge live.
- **Cart (`/cart`)** — native `CartScreen`: line items + donation from shared `cartStore` (default **$5**); **Continue** → `/checkout`.
- **Checkout (`/checkout`)** — native `CheckoutScreen`: order summary from `cartStore`; Place Order validates required fields with red highlights + missing-fields toast; empty-cart toast on cart icon; **Place Order** → `/purchase-confirmation`.
- **Purchase confirmation (`/purchase-confirmation`)** — order mode lists cart lines; donation mode (`?mode=donation`) shows gift-only receipt + “Total Gift”; hearts animate on enter.
- **Sessions list (`/sessions-list`)** — native `SessionsScreen` (Figma `sessions_list___hybrid_redesign`, `515:1791`): search bar, All / Approved / Under Review / Declined chips, sort dropdown (Most Recent / Oldest First / A–Z / Z–A) with chevron pointing down when closed, status-bordered session rows with badges, **View more**; row tap opens `/session-detail?id=`.
- **Shop home (`/shop`)** — native `ShopScreen` (Figma `shop_home`, `498:606` / PRD §6.19): mission copy, donate card ($5/$10/$15/Custom), featured Trash Clean Up Kit ($29.99), category chips, 2-column product grid (Kit $29.99 under Kits/All; Tote $3 / Grabber $23.99 / Child Vest $9.99 / Adult Vest $12.99); Shop tab active; Home/Account/Sessions nav wired to `/shop`.
- **Session detail (`/session-detail`)** — native `SessionDetailScreen` (Figma `session_detail`, `515:1848`): walking-path map via `SessionRouteMapPanel` + `useSessionRouteCoordinates` (local completed-session cache or Fly API route); pan/zoom and basemap layer picker when route exists; status badge, title/date/address, hours/miles/photos stats, Photo Evidence from checkpoint photos when cached
## Design ground truth

- **Figma** is now the authoritative design source — [CleanUpGiveBack file](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) holds 7 flow pages (6 designed + 1 compliance spec), 46 manifest screens, and a Design System page (104 variables, 14 text styles).
- Local workspace: [`frontend/design/figma/`](../frontend/design/figma/README.md) — screen manifest, per-flow notes, **token JSON** in [`tokens/`](../frontend/design/figma/tokens/).
- Runtime tokens: [`frontend/src/constants/tokens.ts`](../frontend/src/constants/tokens.ts) (canonical); `theme.ts` chrome + feature `tokens.ts` re-exports consume it.
- **Privacy & compliance** documented in [`docs/compliance/`](../docs/compliance/privacy-and-data-protection.md) — 13 new spec-only screens; existing screen changes pending approval.
- The Stitch/HTML pipeline is **frozen**. No new screens will be added to `HTML_MAP` or to Stitch.
- Migration is tracked per-screen in [`frontend/design/figma/manifest.yaml`](../frontend/design/figma/manifest.yaml): `designed` → `bound` → `implemented`.

## Sessions + geolocation (implemented — Expo Go test phase)

- **Supabase anonymous auth** on app launch via `AuthProvider` in `_layout.tsx` (`frontend/src/lib/supabase.ts`)
- **Fly sessions API** client (`frontend/src/lib/api.ts`, `sessionsApi.ts`) — persists create/checkpoint/finalize when `EXPO_PUBLIC_API_URL` is set
- **GPS + camera** live in Expo Go via `liveSessionStore` (`expo-location` BestForNavigation at 1s interval; hardened capture filters — stationary detection, accuracy-adaptive 6m threshold, sharp-reversal rejection; EMA-smoothed live arrow; optional Follow toggle; Douglas-Peucker display simplification on maps)
- **WebView map** in Expo Go (MapLibre GL JS + Carto Positron) per ADR-005; user pan/zoom on live and preview maps; live tracker map layer picker (Standard / Streets / Satellite / Hybrid); native MapLibre unchanged for EAS builds
- **Sessions list** fetches from API when configured; falls back to mocks otherwise
- **Backend:** Fastify + Prisma in `backend/sessions/` — schema pushed to Supabase; Fly deploy pending org machine limit

**Deploy API:** see [backend/sessions/README.md](../backend/sessions/README.md). After deploy, set `EXPO_PUBLIC_API_URL` in `frontend/.env`.

## Not implemented yet

- Fly.io production deploy (org machine limit hit — run `fly deploy` manually)
- Supabase dashboard: enable Anonymous auth + run `sql/supabase-init.sql` storage policies if bucket missing
- Production auth (email OTP), Stripe, admin approval UI

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
