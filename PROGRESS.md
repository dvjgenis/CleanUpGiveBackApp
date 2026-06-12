# PROGRESS.md — CleanUpGiveBack Prototype

Session-by-session progress log. Append a new dated block each session.
Distinct from `notes/journey.md` (correction-loop log) and `IMPLEMENTATION_PLAN.md` (task list).

---

## [2026-06-12 Session 1] — Prototype UI polish: dropdowns, nav persistence, new screens, modals

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
