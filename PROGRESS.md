# PROGRESS.md — CleanUpGiveBack Prototype

Session-by-session progress log. Append a new dated block each session.
Distinct from `notes/journey.md` (correction-loop log) and `IMPLEMENTATION_PLAN.md` (task list).

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
