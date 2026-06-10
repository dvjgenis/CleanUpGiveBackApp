# PROGRESS.md — Clean-Up Give Back Prototype

Session-by-session progress tracker. Distinct from `notes/journey.md` (correction log) and `IMPLEMENTATION_PLAN.md` (task list).

---

## [2026-06-06 Session 1] — Address gap analysis, wire navigation, fix blank-screen bug in Expo Go

**Session goal:** Read gap analysis, build 4 missing screens, fix navigation, apply Emil Kowalski motion principles, get prototype functional in Expo Go iOS simulator.
**Workflow used:** Skill-driven + iterative debugging

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/emil-design-eng` | Apply Emil Kowalski motion design principles to all new and existing screens | Active:scale-[0.97], transition-[transform], stagger animations, hover guards applied throughout new screens |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Read gap analysis | `/Users/shivpat/.gemini/antigravity-ide/brain/.../gaps_analysis.md` | ✅ 4 gaps identified |
| Create Setup Complete screen | `frontend/assets/stitch/setup_complete.html` | ✅ With Emil motion principles |
| Create Coachmark Tutorial (6-step) | `frontend/assets/stitch/coachmark_tutorial.html` | ✅ Step transitions, progress dots, spring-like easing |
| Create Approval History screen | `frontend/assets/stitch/approval_history.html` | ✅ Based on order_history structure, stagger animations |
| Create Checkout Form screen | `frontend/assets/stitch/checkout_form.html` | ✅ Shipping + payment, input focus states, sticky CTA |
| Fix account.html navigation | `frontend/assets/stitch/account.html` | ✅ Added button linkElements for all sub-pages |
| Fix shopping cart checkout link | `frontend/assets/stitch/shopping_cart__no_tote_bag_.html` | ✅ Routes to checkout_form not thank_you |
| Fix notification_preference routing | `frontend/assets/stitch/notification_preference___standardized_redo.html` | ✅ Routes to setup_complete |
| Fix order_history back button | `frontend/assets/stitch/order_history.html` | ✅ Fixed {{DATA:SCREEN}} placeholder |
| Register new screens in HTML_MAP | `frontend/src/app/prototype/[screen].tsx` | ✅ 4 new keys added |
| Fix root layout (blank screen bug) | `frontend/src/app/_layout.tsx` | ✅ Replaced NativeTabs with Stack navigator |
| Add metro.config.js for HTML assets | `frontend/metro.config.js` | ✅ Added html to assetExts |
| Fix WebView source loading | `frontend/src/app/prototype/[screen].tsx` | ✅ expo-asset + FileSystem + fetch fallback |
| Fix navigation bridge (iOS WebKit) | `frontend/src/app/prototype/[screen].tsx` | ✅ injectedJavaScriptBeforeContentLoaded + onMessage, postMessage bridge |

### Key Decisions

- **Stack over NativeTabs**: Root layout switched from `NativeTabs` (which hid `/prototype/*` routes) to `Stack` with `headerShown: false`. This is the correct architecture for a full-screen WebView prototype.
- **injectedJavaScriptBeforeContentLoaded + onMessage over onShouldStartLoadWithRequest**: iOS WKWebView doesn't reliably fire `onShouldStartLoadWithRequest` for programmatic `window.location.href` changes. The JS bridge approach (postMessage) is more reliable.
- **expo-file-system over fetch for asset reading**: `Asset.fromModule().downloadAsync()` + `FileSystem.readAsStringAsync(localUri)` is more reliable than `fetch(asset.uri)` for reading bundled HTML assets in Expo Go dev mode.
- **html to assetExts in metro.config.js**: Required for Metro to recognize and bundle `.html` files as assets accessible via `require()`.

### Learnings

- `NativeTabs` from `expo-router/unstable-native-tabs` only registers explicitly named tabs — any route outside those tabs (like `/prototype/*`) is invisible to the navigator.
- `onShouldStartLoadWithRequest` does NOT reliably fire for `window.location.href = '...'` assignments on iOS WKWebView when using `source={{ html }}`.
- `Location.prototype.href` setter override via `Object.defineProperty` silently fails on iOS WebKit — not configurable.
- `injectedJavaScript` runs after page load but `window.ReactNativeWebView` may not be initialized yet; `injectedJavaScriptBeforeContentLoaded` + `DOMContentLoaded` listener is more reliable.
- Metro does not bundle `.html` files as assets by default — must add to `assetExts` in `frontend/metro.config.js`.

---

## [2026-06-10] — Monorepo layout

**Goal:** Organize repo into `frontend/`, `backend/`, and `docs/` while keeping Expo app runnable.

| Task | Status |
|------|--------|
| Move Expo app, assets, design, scripts to `frontend/` | ✅ |
| Scaffold `backend/{maps,payments,sessions}/` | ✅ |
| Centralize docs under `docs/` with frontend/backend subdivisions | ✅ |
| Root stubs (`AGENTS.md`, `CLAUDE.md`, `package.json`) | ✅ |
| Update `.cursor` rules and docs-backpressure hook | ✅ |
| Verify `npx expo export` bundles prototype routes | ✅ |
