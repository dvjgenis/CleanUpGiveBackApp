# PROGRESS.md — CleanUpGiveBack Prototype

Session-by-session progress log. Append a new dated block each session.
Distinct from `notes/journey.md` (correction-loop log) and `IMPLEMENTATION_PLAN.md` (task list).

Canonical detailed log: [`docs/progress.md`](docs/progress.md).

---

## [2026-08-07] — Decision templates, volunteer timeline, readiness page, court packet export, mobile court progress

**Session goal:** User requested five features from a single ask: admin decision templates (decline reasons + note snippets), a volunteer risk timeline, a production readiness page, court packet PDF export, and a mobile "court progress" card for court-ordered volunteers.

**Workflow used:** Plan mode — two parallel Explore agents (admin-web-app, mobile) → four clarifying questions via AskUserQuestion (templates storage, timeline placement, court packet approach, mobile RLS-vs-backend routing) → one Plan agent for the full implementation plan → user approval → sequential implementation with `tsc --noEmit` after each feature.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Decline-reason templates + admin-note snippets | `admin-web-app/src/lib/decisionTemplates.ts`, `SessionPreviewDrawer.tsx` | ✅ hardcoded templates fill an editable field; `declineSession` reason now reaches `admin_audit_log.after_value` |
| Volunteer risk timeline | `admin-web-app/src/lib/live-data.ts` (`loadVolunteerTimeline`), `components/ui/VolunteerTimeline.tsx`, `app/volunteers/[id]/page.tsx` | ✅ chronological view sourced from `admin_audit_log`; added a new `'email sent'` audit action in `lib/notify.ts` |
| Production readiness page | `admin-web-app/src/lib/health-checks.ts`, `actions/health.ts`, `components/ui/ProductionReadinessPanel.tsx`, `/settings`; `backend/sessions/src/server.ts` `GET /health/deep` | ✅ probes Resend, Sessions API, admin API key, Supabase Auth/data, both storage buckets, and a Realtime **round-trip** check (not just connection status) |
| Court packet export | `backend/sessions/src/letterhead/{buildServiceLetter,ServiceLetterPdf}.tsx`, `routes/serviceLetter.ts`, `prisma/schema.prisma` (`CourtOrder` model), admin proxy routes | ✅ extends the existing service-letter PDF with a cover sheet (case reference/due date/required+completed hours/completion %) and per-session "Adjusted from Xh to Yh by admin" annotations |
| Mobile Court Progress card | `backend/sessions/src/routes/courtProgress.ts` (`GET /me/court-progress`), `frontend/src/lib/courtProgressApi.ts`, `features/session-tracking/courtProgressStore.ts`, `features/figma-screens/components/CourtProgressCard.tsx`, `HomeScreen.tsx` | ✅ gated on `serviceType === 'Court Ordered'` (`user_metadata.service_type`) OR an active order — corrected mid-build per explicit user direction, saved to memory as `court-progress-gating` |
| Docs sync | `docs/admin-web-app.md`, `docs/backend/context/sessions.md`, `docs/frontend/context/app.md`, `docs/current.md`, `docs/progress.md` | ✅ |
| Backpressure | `admin-web-app` (`tsc --noEmit` + `next build`), `backend/sessions` (`tsc --noEmit`), `frontend` (`tsc --noEmit`) | ✅ all clean |

### Key Decisions

- Decision templates are hardcoded constants, not a DB-editable table (user's explicit call over the DB-table alternative).
- Volunteer timeline lives on the **existing** `/volunteers/[id]` page, not a new route.
- Court packet **extends** the existing service-letter generator rather than a new standalone generator.
- Mobile court progress routes through a **new backend endpoint**; `court_orders` RLS stays admin-only (no new self-read policy).
- Did not touch unrelated pre-existing working-tree changes present at session start/end — a large concurrent batch of attention-inbox / court-risk dashboard / communication log / session-compare / editable-email-template work (`admin-web-app/src/app/{attention,court-risk,email-templates,sessions/compare}/`, `admin/db/010_email_log.sql`, `011_email_templates.sql`, `frontend/src/components/ui/EmptyState.tsx`, checkpoint-sync-status work in `liveSessionStore.ts`, etc.) is present in the tree but was not authored by this session — left as-is, not reverted, not claimed here.

### Learnings

- `admin_audit_log.target_id` for `court_orders` rows is the **volunteer's user id**, not the court-order row's own id — `upsertCourtOrder` (`actions/courtOrders.ts`) upserts with `onConflict: 'user_id'` and logs `targetId: userId`. This simplified the timeline query considerably (no need to fetch/thread a separate court-order id).
- `'volunteer deleted session'` audit rows are written with `admin_user_id` = the volunteer's own id (`backend/sessions/src/routes/sessions.ts`), not an actual admin — matched in the timeline query via `admin_user_id = userId AND action = 'volunteer deleted session'` rather than `target_id`.
- `audit-log-summary.ts`'s `auditActionLabel`/`auditActionTone`/`describeAuditChanges` were directly reusable for the new volunteer timeline — no need to duplicate label-formatting logic.

---

## [2026-08-07] — Verified heatmap search fix live; shipped county choropleth fill

**Session goal:** User reported the full-screen heatmap search dropdown/Search button still broken after the prior session's fix; investigate, then (separately) fill in real county-shape choropleth for the state drill-down map.

**Workflow used:** Live repro against local dev + production (already-authenticated Chrome MCP tab) with real and simulated-slow-network clicks → could not reproduce → asked user for repro specifics → re-tested directly on production with the exact reported click sequence, still no repro → reported findings and asked to move on. Then: code investigation → implementation → local browser verification across multiple states → typecheck → commit → push → confirmed Vercel prod deploy READY.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Re-verified prior session's search/dropdown fix (`bd7c73f`) against live prod, not just local | `cleanupgiveback-web-app.vercel.app` full-screen county map search | ✅ suggestion click flies to location + drops pin immediately; Search button works right after picking a suggestion — both symptoms from the original report no longer reproduce, including under artificially throttled network |
| Replaced county-level circle-bubble markers with a real polygon choropleth | `admin-web-app/src/components/dashboard/UsHeatmap.tsx` | ✅ every county in a drilled-into state now renders its actual shape, filled by session-count intensity (same treatment as the nation-level state view); zero-session counties render unfilled instead of not appearing |
| Confirmed the choropleth isn't Illinois-specific | same file, `stateCounties` derived from nationwide `us-atlas` counties-10m.json | ✅ spot-checked California in-browser — full county shape set renders correctly with no data |
| Typecheck + commit + deploy | `admin-web-app` | ✅ `tsc --noEmit` clean, commit `f240a81`, pushed to `main`, Vercel prod deploy `dpl_AfKionP6raCfuMvk9p85Jd7f4CGK` confirmed READY |

### Key Decisions

- Did not touch the pre-existing unrelated working-tree diffs present at session start/end (`.cursor/hooks/state/*`, `.gitignore`, `AGENTS.md`, `docs/backend/context/sessions.md`, `admin-web-app/src/components/ui/SessionPreviewDrawer.tsx`, `admin-web-app/src/lib/decisionTemplates.ts`) — out of scope, not from this session's work, left untouched and uncommitted.
- Committed only the single file this session actually changed (`UsHeatmap.tsx`), not a broad `git add -A`, per [[broad-commit-authorization-scope]].

### Learnings

- Confirms [[verify-before-fixing-ui-bug-reports]]: this time the live-production repro genuinely found nothing wrong (unlike the prior incident) — exercising the actual deployed feature, including with an authenticated real session and artificially slowed network, is what makes "I can't reproduce this" a trustworthy answer instead of a guess.
- `loadUsCounties()` (`admin-web-app/src/lib/us-geo.ts`) already loads the full nationwide `us-atlas` counties topology once — any "add county data for state X" request is almost always a rendering/UI gap, not a missing-data gap; check what's already loaded before assuming new geo data needs to be sourced.

---

## [2026-08-07] — Fixed silently-broken heatmap search in production (Photon/Nominatim geocoding)

**Session goal:** User reported the admin heatmap search dropdown / location pin+popup "worked on localhost but not on Vercel"; determine root cause and fix.

**Workflow used:** Vercel deployment audit → live browser repro against the deployed prod URL (Chrome MCP, already-authenticated tab) → network/log inspection → fix → redeploy → re-verify live.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| Confirmed prod deploy matches `HEAD` (ruled out "changes didn't ship") | Vercel project `cleanupgiveback-web-app` | ✅ latest READY deploy at session start = commit `56c1029`, aliased to prod |
| Live-tested the actual feature on the deployed prod URL, not just visual inspection | `cleanupgiveback-web-app.vercel.app` heatmap fullscreen search | ✅ found `/api/place-search` returning `{hits:[],source:"none"}` / one-off `503` — search dropdown never populated, so the pin/popup (which only renders on selection) could never appear |
| Traced root cause to silent fetch failures | `admin-web-app/src/lib/{place-search,photon,census-geocode,place-reverse}.ts` | ✅ every Photon/Nominatim/Census call had no fetch timeout and a bare `catch {}`, so a slow/refused connection from Vercel's egress produced empty results with nothing logged |
| Added timeouts + error logging | same 4 lib files + `app/api/place-search/route.ts`, `app/api/place-reverse/route.ts` | ✅ 5s `AbortSignal.timeout()` on every upstream fetch, `console.error` on each fallback path — commit `bd7c73f` |
| Redeployed and re-verified live | Vercel + Chrome MCP | ✅ `/api/place-search?q=Willis+Tower` now returns real hits (`source:"photon"`); selecting a suggestion flies the map, drops the pin, shows the readable popup with top-right close button |

### Key Decisions

- Superseded the prior same-day entry below (now corrected) that concluded "no fix needed, prod already matches HEAD" — that check only ruled out a stale deploy, it never exercised the feature's actual server-side API calls against production.
- Did not touch the pre-existing unrelated working-tree diffs (`.cursor/hooks/state/*`, `.gitignore`, `AGENTS.md`, `docs/backend/context/sessions.md`) — out of scope, not touched this session.

### Learnings

- Matching Vercel's deployed `githubCommitSha` to `HEAD` proves the right code shipped — it does **not** prove a feature works if that feature depends on third-party server-side calls. Must exercise the live prod endpoint directly (see [[verify-before-fixing-ui-bug-reports]]).
- Free geocoding APIs (Photon, Nominatim, Census) can behave differently from Vercel's serverless egress vs. a developer's home network; combined with bare `catch {}` blocks, failures were completely invisible in both the UI and the logs. Always add a fetch timeout + logged catch for any external call reachable only server-side (see [[silent-geocoding-failures-vercel]]).

---

## [2026-07-26] — Approved session service letter PDF

**Session goal:** Ship shared volunteer + admin PDF (letter page + per-session evidence maps/photos); sync Supabase schema for letterhead columns.

### Tasks Completed

| Task | Location | Status |
|---|---|---|
| PDF generator on Fly Sessions API | `backend/sessions/src/letterhead/` | ✅ |
| PDF routes | `GET/POST …/service-letter.pdf` | ✅ |
| Mobile download UX | `SessionDetailScreen`, `SessionsScreen`, `downloadServiceLetterPdf.ts` | ✅ |
| Admin proxy routes | `admin/app/api/service-letter/` | ✅ |
| Spec + docs | `docs/frontend/specs/service-letter-pdf.md`, `docs/supabase.md` env table | ✅ |
| Prisma `db push` (session pooler) | `backend/sessions/.env` | ✅ |

### Key Decisions

- **One PDF generator** on Fly for volunteer JWT and admin `x-admin-key` (admin portal proxies).
- **`DATABASE_URL` only in `backend/sessions/.env`** — not Expo `frontend/.env`.
- **Local Prisma:** Supabase **session pooler** URI; direct host often unreachable (P1001) from dev machines.

### Remaining for production

- `fly deploy` from `backend/sessions/` with `SUPABASE_SERVICE_ROLE_KEY` (and verify `DATABASE_URL` on Fly).
- Admin `.env.local`: `SESSIONS_API_URL`, `ADMIN_API_KEY`.
- End-to-end QA on device + admin letterhead links.

---

## [2026-07-10 Session 4] — Figma Home Screen → Native (figma-screens feature scaffold + HomeScreen)

**Session goal:** Create a frozen backup of the `session-tracking` Expo Go flow, scaffold a new `figma-screens` feature with all 52 manifest screens as placeholders, and implement the Figma Home screen (node 406:291) as the first native screen.
**Workflow used:** Plan Mode → figma:figma-use skill → get_design_context → Write + Edit

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `figma:figma-use` | Load Figma Plugin API rules before using MCP tools | Rules loaded; `get_design_context` used correctly |
| `superpowers:using-superpowers` | Session-start skill registry | Loaded automatically |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Freeze session-tracking as legacy backup | `frontend/src/features/session-tracking-legacy/` (cp -r) | ✅ |
| Create figma-screens feature scaffold | `frontend/src/features/figma-screens/` | ✅ |
| PlaceholderScreen for all 52 unimplemented screens | `figma-screens/screens/PlaceholderScreen.tsx` | ✅ |
| PreviewApp harness with all 52 screens grouped by Figma page | `figma-screens/dev/PreviewApp.tsx` | ✅ |
| Boot index.tsx from figma-screens | `frontend/src/app/index.tsx` | ✅ |
| Fetch Figma Home screen design (node 406:291) | `get_design_context` MCP call | ✅ |
| Implement HomeScreen from Figma design only | `figma-screens/screens/HomeScreen.tsx` | ✅ |
| Wire `home` as boot screen in PreviewApp | `figma-screens/dev/PreviewApp.tsx` — FIRST_KEY + case | ✅ |
| Fix babel-preset-expo version mismatch (57→54) | `frontend/package.json` | ✅ |

### Key Decisions

- **Figma-only policy:** HomeScreen.tsx derived solely from `get_design_context` for node 406:291 — no repo code patterns referenced. User explicitly requested this.
- **figma-screens isolation:** New feature dir is entirely separate from session-tracking. session-tracking-legacy is a frozen read-only snapshot.
- **Icons:** `@expo/vector-icons` (Ionicons) used as functional equivalents for Figma asset URLs that expire in 7 days.
- **Bar chart:** View-based implementation (no chart lib) — proportional heights from static data matching Figma exactly.
- **ngrok tunnel broken on M-series Mac:** `@expo/ngrok-bin-darwin-arm64` ships empty (no v2 binary for arm64). Workaround: USB + `npx expo start --go`. Documented for future sessions.

### Learnings

- `babel-preset-expo` must match SDK version exactly — v57 installed against SDK 54 causes Hermes "private properties" runtime errors
- `@expo/ngrok-bin-darwin-arm64` package is empty stub; ngrok v2 never shipped arm64 binary; tunnel mode is non-functional on Apple Silicon without a workaround
- `npx expo start --go` flag required when `eas.json` exists — otherwise Expo CLI seeks a dev build instead of Expo Go
- USB connection to iPhone + `--go` flag is the reliable dev path on this machine
- Figma `get_design_context` returns Tailwind/React web code; must manually translate all CSS to React Native StyleSheet (flexbox model differs, no CSS grid, no absolute position via classes)

---

## [2026-06-30 Session B] — Figma Design Tokens & Variables Extension

**Session goal:** Audit existing Figma variable collections and extend them: add WEB/iOS/Android code syntax to all variables, fix forbidden `ALL_SCOPES`, rename mode names from "Mode 1" to descriptive values, and create Typography Primitives + Typography semantic variable collections.
**Run ID:** `cugb-tokens-2026-06-30`
**Workflow used:** Figma MCP (`use_figma` + `figma-generate-library` skill), sequential phased execution.

### Outcome

| Deliverable | Location | Status |
|---|---|---|
| WEB/Android/iOS code syntax on all 46 pre-existing variables | All 4 collections | ✅ |
| Collection modes renamed (`Mode 1` → `Value` / `Light`) | Primitives, Spacing, Radius, Color | ✅ |
| `color/primary` scope fixed (`ALL_FILLS` → `FRAME_FILL, SHAPE_FILL, STROKE_COLOR`) | Color collection | ✅ |
| `lime/500` scope fixed (`ALL_SCOPES` → `[]` hidden primitive) | Primitives collection | ✅ |
| `color/accent/lime` scope fixed (`ALL_SCOPES` → `FRAME_FILL, SHAPE_FILL`) | Color collection | ✅ |
| Typography Primitives collection (16 vars) | Font families (3), weights (4), sizes (9) | ✅ |
| Typography semantic collection (42 vars) | Aliases per text style × family/weight/size | ✅ |
| Spacing bar widths variable-bound | Design System page `spacing/*` rects | ✅ |
| Radius sample corner radii variable-bound | Design System page `radius/*` rects | ✅ |
| Phase 1 validation | 104 local vars, 0 broken aliases, 0 missing code syntax, 0 scope violations | ✅ PASS |

### Final token counts

| Collection | Mode | Variables |
|---|---|---|
| Primitives | Value | 15 |
| Color | Light | 19 |
| Spacing | Value | 8 |
| Radius | Value | 4 |
| Typography Primitives | Value | 16 |
| Typography | Value | 42 |
| **Total** | | **104** |

### Key decisions

- Typography Primitives holds raw font families, weights (as Figma `FONT_STYLE` strings), and sizes. Typography holds semantic aliases (one per text style × 3 properties).
- Spacing scope kept as `WIDTH_HEIGHT, GAP` (existing convention retained, not narrowed).
- Effect styles: 2 active (`Shadow/Nav/Bottom`, `Shadow/Bar/Top`) — 9 unused styles removed 2026-07-01 after shadow reduction on pages 1–6.
- Screen re-binding remains out of scope.

---

## [2026-06-30 Session] — Figma Design System v1 on Design System page

**Session goal:** Build design system in Figma from audited screen designs (not repo docs); populate empty Design System page `1:3`.
**Workflow used:** Figma MCP (`use_figma` + `figma-generate-library` skill), sequential phased execution.

### Outcome

| Deliverable | Location | Status |
|---|---|---|
| Variable collections (44 tokens) | File-level: Primitives, Color, Spacing, Radius | ✅ |
| Text styles (14) | Local styles | ✅ |
| Foundations docs | [Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) — Cover, Getting Started, Color, Typography, Spacing/Radius, Known Inconsistencies | ✅ |
| BottomNav | Cloned from screen Navbar [`536:2046`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=536-2046) — replaces simplified placeholder (`672:471`) | ✅ |
| Input | Component set [`675:125`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=675-125) — `State=Default \| Focus \| Error`; value text center-aligned | ✅ |
| Accent lime token | `color/accent/lime` → `#c2d832` + Color Palette swatch | ✅ |
| Pending border palette | `color/status/pending/border` → `#fcab29` swatch on Color Palette | ✅ |
| Screen re-binding | Existing flow screens | ⏭️ Out of scope v1 |

### Locked tokens

- Primary: `#009540` only (removed `#0fca7a`, `#008739`, `#006b2c`)
- Nav inactive: `#3e4a3d` (separate from secondary `#6e7a6c`)
- Fonts: Sanchez, Noto Sans, IBM Plex Sans
- Excluded: Archived page `1:2`

### Key decisions

- v1 scope: foundations + core components on DS page only
- Success surface: single `#f7fff1`
- Search radius: 22px dedicated token
- Noto Sans Bold kept as Body/Strong style

---

**Session goal:** Fix duplicate dropdown arrows on "Few Details" screen; persist hamburger nav across Sessions and Shop tabs; add donation checkout/confirmation flow; add photo submitted confirmation screen; wire distinct session vs event bottom-sheet popups; fix sidebar X button; fix account page scroll clipping.
**Workflow used:** Chat / Skill-driven (`/run`)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/run` | Launch Expo iOS simulator to test UI changes | `npx expo start --ios --localhost --clear` running; prototype verified on simulator |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Replace `<select>` dropdowns with custom div dropdowns | `account_details___standardized_progress.html` | ✅ No native iOS arrow; single chevron rotates on open/close |
| Persist hamburger header + 3-button nav on Sessions tab | `sessions_list___hybrid_redesign.html` | ✅ Sidebar drawer, backdrop, and 3-button nav added |
| Persist hamburger header + 3-button nav on Shop tab | `shop_home___prd___reference_aligned.html` | ✅ Same pattern applied |
| New donation checkout screen | `donation_checkout.html` | ✅ Header, summary card, contact, payment fields, sticky CTA |
| New donation confirmation screen | `donation_confirmation.html` | ✅ Animated checkmark, summary card, Return to Home / View History CTAs |
| New photo submitted confirmation screen | `photo_submitted.html` | ✅ Pop-in checkmark, timer chip, Continue Tracking CTA |
| Wire all new screens into router | `frontend/src/app/prototype/[screen].tsx` | ✅ HTML_MAP, NAV_RULES, SCREEN_RULES, LOCATION_REMAP updated |
| Distinct session bottom-sheet popup (vs event popup) | `home_hamburger.html` | ✅ `openSessionModal(idx)` / `closeSessionModal()` with SESSIONS data array |
| Fix session modal + event modal cut off by navbar | `home_hamburger.html` | ✅ Modal backdrops raised to `z-[60]` |
| Fix sidebar X button navigating away instead of closing | `home_hamburger.html` | ✅ Removed `data-nav-wired="true"` from `#sidebar-close` |
| Fix account page scroll clipping | `account.html` | ✅ `pb-28` → `pb-40` on `<main>` |

### Key Decisions

- Custom div-based dropdowns chosen over `<select>` + CSS `appearance-none` because iOS WKWebView does not reliably suppress the native select arrow via CSS alone.
- Modal z-index raised to `z-[60]` (above navbar's `z-50`) to prevent bottom nav from overlapping bottom-sheet popups.
- Sidebar X button `data-nav-wired="true"` removed so the router does not intercept the close tap.

### Learnings

- iOS WKWebView ignores `-webkit-appearance: none` on `<select>` — always use fully custom div dropdowns for prototype selects.
- `data-nav-wired="true"` on any element causes `[screen].tsx` buildNavScript to intercept its click for routing — do not apply to UI controls that should stay local (close buttons, toggles).
- Bottom-sheet modals must be `z-[60]` or higher; the fixed bottom nav sits at `z-50`.
- Expo iOS simulator requires `--localhost` flag; LAN IP fails on simulator (physical device needs LAN).

---

## [2026-06-12 Session 2] — Export all 39 HTML prototype screens to Figma as editable frames

**Session goal:** Write every screen from the Expo Go prototype flow into the CleanUpGiveBack Figma file as real auto-layout frames, ready for redesign.
**Workflow used:** Skill-driven (`/figma-use`)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/figma-use` | Write screens to Figma via Plugin API | 39 screens created as real auto-layout frames across 6 pages |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Identify correct Expo Go screen source | `src/app/prototype/[screen].tsx` | ✅ HTML Stitch screens via WebView — NOT the React Native `.tsx` screens |
| Create 6 Figma pages by flow | Figma file `DrDcQH14n7ntDQ80F7au9S` | ✅ 1·Onboarding, 2·Home & Events, 3·Shop & Payments, 4·Session Tracking, 5·Sessions History, 6·Account & Settings |
| Onboarding page — 7 screens | `assets/stitch/welcome*.html`, `create_account*.html`, `account_details*.html`, `notification_preference*.html`, `setup_complete.html`, `coachmark_tutorial.html` | ✅ Nodes 78:2–89:52 |
| Home & Events page — 3 screens | `assets/stitch/home_dashboard*.html`, `home_hamburger.html`, `events_detail.html` | ✅ Nodes 90:2–90:204 |
| Shop & Payments page — 8 screens | `assets/stitch/shop_home*.html`, `product_detail*.html`, `shopping_cart*.html`, `checkout_form.html`, `thank_you*.html`, `donate.html`, `donation_checkout.html`, `donation_confirmation.html` | ✅ Nodes 81:2–87:86 |
| Session Tracking page — 8 screens | `assets/stitch/session_setup*.html`, `live_session*.html`, `photo_checkpoint.html`, `photo_submitted.html`, `restart_required.html`, `submission_confirmation*.html`, `approval_history.html` | ✅ Nodes 86:2–92:64 |
| Sessions History page — 6 screens | `assets/stitch/sessions_list*.html`, `sessions_calendar*.html`, `session_detail.html`, `cleanup_giveback_redone*.html` | ✅ Nodes 88:2–93:173 |
| Account & Settings page — 7 screens | `assets/stitch/account.html`, `settings.html`, `notification_settings*.html`, `privacy_security.html`, `order_history.html`, `donation_history.html`, `export_service_record.html` | ✅ Nodes 91:2–95:128 |

### Key Decisions

- Target confirmed as HTML Stitch screens (`assets/stitch/*.html`) not React Native `.tsx` — the `prototype/App.tsx` component is never mounted because expo-router's entry point overrides `registerRootComponent`.
- Screens rendered as 390×844 auto-layout frames using real Figma vector/text nodes (not screenshot images) so the designer can edit every layer.
- Material Symbols Outlined icons cannot be loaded via Figma Plugin API — represented as 24×24 `#bdcaba` placeholder rects with 2-char labels.
- 6 parallel agents used (one per Figma page) to maximize throughput while staying within per-call op limits.

### Learnings

- The `prototype/App.tsx` React Native file uses `registerRootComponent` but is silently overridden by `expo-router/entry` — it is dead code. Expo Go always boots expo-router.
- Figma Plugin API `figma.loadFontAsync` must be awaited for every font family+style combination before any text node mutation, including `appendChild` on frames that contain text children.
- `layoutSizingHorizontal = 'FILL'` must be set AFTER `parent.appendChild(child)` — setting it on an unparented node throws silently or is ignored.

---

## [2026-07-11 Session 5] — Calendar picker UX fixes + Compass component (985:567)

**Session goal:** Fix drum/wheel date picker scrollability and header UX, rebuild the date badge row, implement the Header Container (406:300), and build a fully functional SVG compass (985:567) with live magnetometer heading.
**Workflow used:** Chat → Edit/Write (no plan mode; iterative visual feedback loop)

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `superpowers:using-superpowers` | Session-start skill registry | Loaded automatically |
| `figma:figma-use` | Figma design context lookups (406:305, 406:300, 985:567) | Design tokens and layout extracted |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Fix drum picker scrollability | `ServiceHoursWeekPicker.tsx`, `WheelPickerColumn.tsx` | ✅ Replaced Pressable backdrop with sibling absoluteFill Pressable; ScrollViews now receive touch responder |
| Remove Day column from DateWheelPicker | `DateWheelPicker.tsx` | ✅ Month + Year only; day preserved for clamping |
| Picker header: "‹ Back" when drum open | `ServiceHoursWeekPicker.tsx` | ✅ Conditional header; backBtnInner View with flexDirection:row fixes chevron+text alignment |
| Remove "Today" button when drum picker open | `ServiceHoursWeekPicker.tsx` | ✅ Gated on `!monthYearPickerVisible` |
| Rebuild date badge row (Figma 406:305) | `ServiceHoursWeekPicker.tsx` | ✅ View container + absolute-positioned text/icon + Pressable overlay |
| Implement Header Container (Figma 406:300) | `ServiceHoursWeekPicker.tsx` | ✅ "Service Hours" + "20.5 hrs" + date nav row |
| Build Compass component (Figma 985:567) | `src/components/ui/Compass.tsx` | ✅ expo-location watchHeadingAsync; Reanimated rotate; SVG dial |
| Refactor LiveSessionScreen to use Compass | `src/screens/LiveSessionScreen.tsx` | ✅ All inline SVG paths replaced with `<Compass size={44} />` |
| Fix compass visual: add needle body + line ticks | `Compass.tsx` | ✅ Rect bodies added; TICK_NEAR/FAR diamonds replaced with Polygon arrows |
| Redesign compass: static bg + rotating red tick | `Compass.tsx` | ✅ Background fixed; red tick rotates with +heading; center label shows N/NE/E… |
| Add all 4 cardinal green ticks + centering fix | `Compass.tsx` | ✅ CARDINAL_ANGLES=[0,90,180,270]; label top computed explicitly |

### Key Decisions

- **Pressable as backdrop**: `Pressable` intercepts scroll gestures from child `ScrollView`s — fix is sibling `Pressable style={absoluteFillObject}` next to the card, not wrapping it.
- **Pressable layout bug**: `Pressable` does not reliably apply `flexDirection: 'row'` to children — always wrap icon+text in an inner `View` with explicit flex.
- **Date badge absolute positioning**: `Pressable` as a layout container for a badge (icon + text) fails on both flex and absolute modes — use plain `View` for layout, overlay `Pressable` for taps.
- **Compass heading init**: first `watchHeadingAsync` reading applied as immediate snap (no `withTiming`) to avoid dial spinning from 0° on mount.
- **Compass architecture**: static SVG background (cardinal/intercardinal ticks); separate `Animated.View` for red tick rotating by `+heading` (facing direction at top); center `Text` label updates via `useState`.

### Learnings

- `onStartShouldSetResponder={() => true}` on a View steals the responder from ALL child ScrollViews — never use it as a "capture backdrop" pattern.
- `Pressable` `flexDirection: 'row'` style does not apply to children reliably in RN — confirmed pattern: inner `View` with `flexDirection: 'row'` inside every Pressable that needs row layout.
- Compass "facing direction" design: red tick rotates by `+heading` (clockwise with heading) so the top of the ring always shows the direction the phone is pointing. Static background ticks serve as cardinal/intercardinal reference marks.
- `bearingToLabel`: `Math.round(deg/45) % 8` maps continuous heading to 8-point cardinal label.

---

## [2026-08-04] — Fix stationary-session route line; diagnose Sessions tab / backend outage

**Session goal:** Stop the live/replay map from drawing a walking path when the user hasn't moved, then diagnose why a locally-logged session wasn't appearing in the Sessions tab.

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Raise GPS movement gate so stationary jitter isn't recorded as a route point | `frontend/src/features/session-tracking/utils/routeFiltering.ts` | ✅ `getMinMovementMeters` floor raised (1m→2m, 0.25×→0.4× accuracy); updated `routeFiltering.test.ts` expectations |
| Diagnose "no sessions logged yet" on Expo Go | (investigation only) | ✅ Traced to `cleanup-sessions` Fly backend outage (stale `DATABASE_URL`, see [[fly-cleanup-sessions-outage]] memory) — finalize sync fails, session stays `active`, `SessionsScreen.tsx` filters those out with no local fallback |
| Push accumulated uncommitted work to `origin/main` | 23 files (admin-web-app realtime refresh, finalize retry/sync-warning banner, route fix) | ✅ Commit `1b824b3` |
| Security review flagged admin RLS policy privilege escalation | `admin/db/008_admin_sessions_realtime_read.sql` | ⚠️ Deferred — user chose "hold off, don't change auth yet"; needs `app_metadata` migration + teammate coordination before fixing |

### Key Decisions

- Movement-gate fix targets the gate threshold only (not `isStationary`'s speed logic), since raising the speed floor would reject genuine slow "cleanup" walking pace — the app's real use case.
- Admin-role privilege escalation (client-writable `user_metadata.role` used for admin checks app-wide, not just the new RLS policy) is a known, deliberately deferred issue — see `admin-role-privilege-escalation` memory. Do not fix without re-confirming with the user.

### Learnings

- GPS jitter while stationary commonly exceeds a `accuracy × 0.25` movement floor at good reported accuracy (4-8m), which is what let a single noisy fix register as a "walked" route point — fixed by raising the floor, not the speed threshold (`MIN_SPEED_TO_RECORD_MPS` stays low to still catch slow real walking).
- `SessionsScreen.tsx` has no offline/local fallback — any failed `finalizeSession` sync makes a session permanently invisible in that tab even though local state believes it completed. The finalize-retry + sync-warning banner (already in progress before this session) is the mitigation, but the underlying Fly/Postgres outage is infra, not app-fixable from this machine.
- Before assuming a session-sync bug is client-side, verify the Fly backend can actually write to Postgres first — see [[fly-cleanup-sessions-outage]].

---

## [2026-08-06] — Fix admin-web-app stale data, dead review buttons, and session-privacy gaps

**Session goal:** Diagnose why mobile sessions weren't showing in admin (last visible session 13d stale), then fix a string of admin-web-app bugs Donna found while using it live: dead Dashboard buttons, wrong photo count, missing volunteer-name reliability, and in-progress sessions being admin-visible.
**Workflow used:** Chat, `superpowers:systematic-debugging` for the root-cause investigation

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `superpowers:systematic-debugging` | Root-cause the stale-sessions report before proposing a fix | Found `/sessions`, `/dashboard`, `/` were statically prerendered at build time (no `dynamic`/`revalidate` export, service-role read triggers no dynamic API) — froze session data as of last deploy |
| `update-config` | Add a Bash permission rule for `vercel deploy --prod` after the auto-mode classifier blocked a direct prod deploy | `.claude/settings.local.json` created (gitignored) with `Bash(vercel deploy --prod*)` allow rule |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Fix stale Sessions/Dashboard/Home (static prerender) | `admin-web-app/src/app/{sessions,dashboard,}/page.tsx` | ✅ Added `export const dynamic = 'force-dynamic'` to all three |
| Fix "Photos on trail" undercount | `SessionPreviewDrawer.tsx`, `SessionWalkingPathMap.tsx` | ✅ Was counting checkpoint pins (1 per checkpoint) instead of actual photos (selfie+progress per checkpoint) — sourced from `evidence.photos.length` |
| Make volunteer-name sync reliable | `frontend/src/lib/supabase.ts` (`syncVolunteerProfile`) | ✅ Was fire-and-forget, single attempt, no verification — now retries with backoff (500/1500/3000ms) and confirms `updateUser`'s response reflects the new `full_name` before trusting it |
| Wire up dead Dashboard "Review"/"Start" buttons | `DashboardPage.tsx` | ✅ Both had no `onClick` — now open the same `SessionPreviewDrawer` `/sessions` uses |
| Remove non-functional bulk-select checkboxes + tip | `DashboardPage.tsx` | ✅ Checkboxes were `readOnly`/dead; Donna reviews sessions individually, not in bulk |
| Make "Needs you" queue scrollable | `DashboardPage.tsx` | ✅ Was hard-capped at 5 items with the rest invisible; now shows the full queue, scrollable past ~5 rows |
| Remove Dashboard Snapshot section | `DashboardPage.tsx` | ✅ Removed per request; cleaned up now-unused `approvalRatePct`/`ChevronRightIcon` |
| Exclude in-progress (`active`) sessions from all admin surfaces | `admin-web-app/src/lib/live-data.ts`, `SessionsPage.tsx` | ✅ Privacy requirement — admin must not see a volunteer's session while still in progress. `.neq('status','active')` added to every sessions query (Dashboard/Sessions/volunteer detail/court progress/user counts); removed now-unreachable "Active" filter chip. 6 real active/abandoned sessions confirmed excluded. |

### Key Decisions

- GitHub Actions was mid-outage (confirmed via githubstatus.com) for most of this session — every deploy went out via direct `vercel deploy --prod --yes` instead of the `Deploy admin-web-app` GitHub Action, after the user added a scoped `Bash(vercel deploy --prod*)` permission rule.
- git push required switching the active `gh`/git credential from `spatel-fm` (no write access) to `spatel54` (has push access) — `gh auth switch --user spatel54` + `gh auth setup-git`.
- "Active" sessions are excluded at the query layer (`live-data.ts`), not by hiding the status client-side — guarantees no admin surface can ever leak one, present or future.

### Learnings

- A Next.js App Router route with no `dynamic`/`revalidate` export and a cookie-free data fetch (service-role Supabase client, no `cookies()` call) gets statically prerendered at build time with no warning — `next build`'s route table (`○` vs `ƒ`) is the fastest way to confirm this class of bug.
- Client-side `router.refresh()` (e.g. a Supabase-realtime hook) cannot un-stale a statically-prerendered route on Vercel — it just re-requests the same cached payload. Only a redeploy or `revalidatePath`/`revalidateTag` actually re-executes the server component.
- `syncVolunteerProfile` and `liveSessionStore`'s finalize retry now share the same backoff-retry pattern — worth reusing for any other single-attempt Supabase write in onboarding/session flows.
- Sessions can be real, identifiable DB rows stuck in `status='active'` indefinitely (finalize never completed) — not fake test data. Worth periodically checking `select id from sessions where status='active'` for volume, since it signals ongoing finalize-sync reliability, not just a privacy filter.

---

## [2026-08-06 Session 9] — Fix Fly DB outage, stationary-route replay, sync ServiceType/phone to admin

**Session goal:** Confirm mobile sessions actually reach the backend and admin now that Fly.io is a paid app; fix a stationary-session replay bug; surface each volunteer's ServiceType next to their sessions in admin.
**Workflow used:** Chat, with `Explore` subagents for codebase tracing (mobile Sessions tab data source, service-type field path, ServiceType storage/join point)

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Diagnose + fix `cleanup-sessions` Fly `DATABASE_URL` outage | Fly secret `DATABASE_URL` (no code change) | ✅ Reproduced via live `POST /sessions` (500, mangled tenant name); user reset the Supabase DB password, `flyctl secrets set` pushed the corrected pooler URL, verified with a real write → `201` → confirmed row in Postgres → cleaned up test row |
| Audit mobile Sessions tab read path | (research only) | ✅ Confirmed it hits real `GET /sessions`, not local-only; found silently-swallowed fetch errors and a mock-data fallback when `EXPO_PUBLIC_API_URL` is unset |
| Audit EAS build env-var config | (research only) | ✅ `eas env:list` showed zero vars configured for development/preview/production — real builds would ship with `EXPO_PUBLIC_API_URL`/Supabase vars all `undefined`; flagged, not yet fixed |
| Fix stationary-session replay drawing a fake walked line | `frontend/src/features/session-tracking/utils/routeFiltering.ts`, `components/SessionRouteMapPanel.tsx`, `components/SessionRouteMapPreviewWebView.tsx` | ✅ Added `getRouteSpanMeters`/`collapseStationaryRoute` (8m floor) so a GPS-settle jitter point no longer renders as an animated line; also fixed the WebView branch, which previously showed no marker at all for a single-point route |
| Persist volunteer phone + account-level ServiceType to Supabase | `frontend/src/lib/supabase.ts` (`syncVolunteerProfile`), `frontend/src/features/onboarding/onboardingStore.ts` (`getE164Phone`), `frontend/src/screens/SetupCompleteScreen.tsx` | ✅ Extended the existing `full_name` sync (with its verify-then-retry pattern) to also write `phone`/`service_type` into `user_metadata` at the terminal onboarding step |
| Surface ServiceType next to each volunteer in admin Sessions tab | `admin-web-app/src/lib/volunteers.ts`, `live-data.ts`, `mock-data.ts`, `components/pages/SessionsPage.tsx`, `components/ui/SessionPreviewDrawer.tsx`, new `components/ui/ServiceTypeBadge.tsx` | ✅ Directory-level `serviceType` resolved from `user_metadata.service_type`, badge shown next to volunteer name (list + drawer) and as a Session Info row |
| Deploy admin-web-app to production | — | ✅ `vercel deploy --prod --yes`, live at `cleanupgiveback-web-app.vercel.app`; `/sessions` still correctly `ƒ` (dynamic), not statically prerendered |

### Key Decisions

- ServiceType stays **account-level, not per-session** — set once at onboarding, same value shown for every session that volunteer logs. User explicitly chose this over a per-session picker.
- ServiceType/phone persist into Supabase `user_metadata` (same mechanism as `full_name`) rather than a new `profiles` table/migration — avoids a schema change for a field with no other relational use yet.
- Mobile changes were committed and pushed to `main` but **not** shipped via EAS build this session — user deferred that. Admin-web-app was pushed and deployed to production.

### Learnings

- Paying a Fly.io bill does not fix a broken `DATABASE_URL` secret — those are orthogonal failure modes (billing/suspension vs. a stale DB credential). Always verify with a live write, not just `/health`.
- `EXPO_PUBLIC_*` vars in a gitignored `.env` are invisible to EAS cloud builds unless mirrored into `eas env:create` — local `expo start` dev testing can look fully wired while a real device build silently falls back to mock data.
- `ServiceType` had been mobile-only, in-memory, unpersisted (`onboardingStore.ts` comment: "no persistence yet") despite already having onboarding UI for it — a good reminder to check persistence, not just UI presence, when asked "does X get logged accurately."

---

## [2026-08-06 Session 10] — Real GPS geocoding + real neighborhood map for the admin US activity heatmap

**Session goal:** Make the admin dashboard's "US activity" map plot real session locations instead of a hardcoded Illinois placeholder, and give the county drill-down a real map (not a schematic tile mockup) with usable names, search, and full-screen controls.
**Workflow used:** Chat, iterative — each round driven by a live browser-tested bug report or follow-up ask.

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Wire dead Waiting/Approved/Hours dashboard tiles to `/sessions` | `components/pages/DashboardPage.tsx` | ✅ Tiles linked to `/dashboard` (no-op self-link) |
| Geocode real session GPS (route/checkpoint) → state + county FIPS | `lib/live-data.ts`, `lib/us-geo.ts` | ✅ Point-in-polygon against states/counties TopoJSON, no external geocoding API/cost; sessions with no GPS fall back to the IL placeholder with `state_fips_placeholder` flagged |
| Fix 0-session county drill-down | `lib/mock-data.ts` (`buildGeoActivity`) | ✅ `byCounty` was always empty for live sessions — now aggregated from geocoded `county_fips` |
| Ensure the map never shows mock/fixture data | `app/analytics/page.tsx`, `app/insights/page.tsx`, `components/pages/AnalyticsPage.tsx`, `DashboardPage.tsx` | ✅ Added a `realSessions` prop threaded separately from the page's mock-fallback `sessions`, so Insights/Analytics map stays real even when other charts show demo fixtures |
| Replace schematic 8-tile Cook-County-only neighborhood mockup with a real map | new `components/dashboard/CountyTractMap.tsx`, `lib/census-tracts.ts` | ✅ MapLibre GL (Carto Voyager basemap, already used elsewhere in the app) + real US Census tract boundaries (Census Bureau TIGERweb `Generalized_ACS2023` REST API, free/no-key), fetched per-county on demand — works for any US county, not just Chicago |
| Real neighborhood names on hover (not "Census Tract 8080.01") | new `lib/nominatim.ts`, `UsHeatmap.tsx`, `CountyTractMap.tsx` | ✅ Reverse-geocodes via OpenStreetMap Nominatim, but only for tracts with actual session activity (rate-limited to ~1req/sec — can't geocode a county's full 1,000+ tract set); zero-activity tracts fall back to a cleaned tract ID |
| Search box for counties/neighborhoods in the sidebar list | `UsHeatmap.tsx` | ✅ Client-side name filter over the existing ranked list, state reset via render-time adjustment (not an effect) to avoid a `set-state-in-effect` lint violation |
| Full-screen mode for the county map | `CountyTractMap.tsx` | ✅ Same fixed-overlay pattern as the existing `SessionWalkingPathMap.tsx`; Escape-to-exit |
| Zoom controls + address/place search in full-screen mode | `CountyTractMap.tsx`, `lib/nominatim.ts` (`searchPlace`) | ✅ MapLibre `NavigationControl` added/removed on fullscreen toggle; Nominatim forward-geocode search flies the map to the result |
| Fix map bleeding past its rounded card corner | `CountyTractMap.tsx` | ✅ WebGL canvas can composite to a layer that ignores parent `overflow-hidden`/`border-radius` — fixed by applying the radius directly to `.maplibregl-canvas` |
| Distinguish resolved vs. fallback names on hover | `CountyTractMap.tsx`, `UsHeatmap.tsx` | ✅ Real Nominatim names render full-contrast black; unresolved tract-ID fallbacks stay muted gray |
| Delete dead, unwired earlier attempt at this same feature | removed `components/ui/EnhancedUsHeatmap.tsx`, `GeocodingStats.tsx`, `lib/enhanced-geo-activity.ts` | ✅ Confirmed nothing imported them before deleting |

### Key Decisions

- Chose point-in-polygon against bundled TopoJSON/Census tract data over a paid geocoding API — zero marginal cost, and the states/counties TopoJSON was already being fetched for the map's own rendering.
- Census tracts (not city-specific "community area" datasets like Chicago's 77) were chosen for the neighborhood tier specifically so the feature works for *any* county nationwide, not just Cook County — confirmed with the user before building.
- Real place names are only fetched for tracts with actual session activity, never a county's full tract set, to respect Nominatim's ~1 req/sec usage policy. This means zero-activity tracts permanently show a tract-ID fallback on hover, not a real name — an accepted tradeoff, not a bug.
- Deleted rather than patched an old unused `EnhancedUsHeatmap`/`enhanced-geo-activity.ts` attempt at the same feature once it started failing `tsc` after the `UsHeatmap` prop change — verified zero importers first.

### Learnings

- `admin-web-app` already had MapLibre GL JS + Carto Voyager raster tiles standardized in two other components (`EventLocationMap.tsx`, `SessionWalkingPathMap.tsx`) — worth checking for an existing mapping pattern before reaching for a new library when a "real map" feature comes up again. Extracted the shared style into `lib/maplibre-basemap.ts` to stop the third copy-paste.
- The Census Bureau's TIGERweb has both full-resolution (`Tracts_Blocks`) and pre-generalized (`Generalized_ACS2023`) tract layers — the generalized one is ~8x smaller (Cook County: 1.1MB vs 9.5MB) and plenty precise for a session-count choropleth; worth defaulting to generalized boundary layers for any future Census geometry fetch.
- `sessions.route` (GPS trail, `[lng,lat]` pairs) and `checkpoints.latitude/longitude` were already being captured by the mobile app but silently unused by admin-web-app's map — a reminder to check what data a table already carries before assuming a feature needs new instrumentation.
- React's `set-state-in-effect` lint rule flags `useEffect(() => setX(...), [dep])` reset patterns; the recommended fix is adjusting state during render (`if (trackedDep !== dep) { setTrackedDep(dep); setX(...) }`) instead — avoids an extra render pass and keeps the lint clean.
