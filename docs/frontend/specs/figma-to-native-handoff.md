# Spec: Figma-to-Native Handoff

## Summary

This spec defines the process and acceptance criteria for migrating the app from the frozen Stitch HTML prototype to native React Native screens built against the Figma design ground truth. The Figma cloud file (`DrDcQH14n7ntDQ80F7au9S`) holds 7 flow pages (6 designed + 1 compliance spec-only), **46 screens** in `manifest.yaml` (33 designed + 13 spec-only), and a Design System page with 104 variables and 14 text styles. The migration replaces each WebView HTML screen with a native Expo Router route, one screen at a time, using `frontend/design/figma/manifest.yaml` as the migration index.

## User stories

- As an implementer, I want a single manifest that maps each Figma screen to its future route key, so I can pick up any screen without hunting across files.
- As an implementer, I want clear token references (Figma DS page + `brand.md`) so I never hard-code colors or fonts.
- As a maintainer, I want the HTML prototype to keep working during migration so Expo Go demos are never broken mid-sprint.
- As a product owner, I want to track migration progress per screen (`designed` → `bound` → `implemented`) so I know how complete the native app is.

## Acceptance criteria

### Phase 0 — Scaffold (this phase)
- [x] `frontend/design/figma/` folder created with `README.md`, `manifest.yaml`, `pages/`, `tokens/`, `exports/`, `components/`
- [x] `manifest.yaml` contains all 33 canonical screens across 6 Figma pages, seeded from `HTML_MAP`
- [x] 13 compliance routeKeys registered (Page 7 + `account-privacy`, `privacy-permissions`) — spec-only, 2026-06-30
- [x] ADR-002 recorded and linked from `docs/adr/overview.md` and `docs/frontend/context/project.md`
- [x] Living docs (`assets.md`, `app.md`, `brand.md`, `screen-map.md`, `current.md`, `implementation-plan.md`) updated
- [x] `[screen].tsx` carries a `@deprecated` JSDoc comment; `stitch_htmls/LEGACY.md` added
- [x] HTML prototype still runs: `cd frontend && npx expo start` opens on `welcome___standardized_progress`

### Phase 1 — Per-screen implementation (future sprints)
- [ ] For each screen, `manifest.yaml` status is advanced to `bound` before RN implementation begins
- [ ] Tokens in `frontend/src/constants/theme.ts` match the Figma semantic `Color` variables documented in `docs/frontend/brand.md`
- [ ] Each RN screen lives at `frontend/src/app/<routeKey>.tsx` (or within an appropriate group folder) following Expo Router file-based conventions
- [ ] Screen matches Figma design at the component level: typography uses correct text styles, colors use semantic tokens, spacing uses design system scale
- [ ] Screen passes `npx tsc --noEmit` with no new errors
- [ ] Screen meets WCAG 2.1 AA contrast and the accessibility checklist in `docs/frontend/screen-map.md`
- [ ] `manifest.yaml` `status` updated to `implemented` once the RN screen ships
- [ ] Corresponding `/prototype/<legacyHtmlKey>` route removed from `HTML_MAP` once all screens in a flow reach `implemented`

### Phase 2 — Prototype retirement (future milestone)
- [ ] All 33 canonical screens reach `status: implemented` in `manifest.yaml`
- [ ] `frontend/src/app/prototype/` folder removed and `index.tsx` updated to the new entry route
- [ ] `frontend/assets/stitch/` and `frontend/design/stitch_htmls/` archived or deleted
- [ ] `docs/current.md` updated to reflect full native implementation

## Related, non-conforming build

`frontend/src/features/session-tracking/` implements the full Session
Tracking flow (PRD §6.9–6.15) in code, but **does not** follow this spec's
Phase 1 acceptance criteria: screens live outside `frontend/src/app/`, there
is no per-screen route at `frontend/src/app/<routeKey>.tsx`, and
`manifest.yaml` statuses were not advanced to `implemented`. It was built as
an isolated, explicitly-requested exploratory slice with its own preview
harness (`dev/PreviewApp.tsx`) — see that folder's `README.md`. Treat it as
a reference implementation to draw from when Session Tracking's screens are
migrated for real under this spec, not as migration progress itself.

## Out of scope

- Figma MCP token export automation (addressed separately when DS is stable)
- Code Connect / Figma-to-RN code generation
- Backend API implementation (tracked in `docs/implementation-plan.md`)
- Design changes to existing Figma screens (handled in Figma; update `manifest.yaml` notes as needed)

## Dependencies

- Figma file access: [`CleanUpGiveBack`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack)
- [`frontend/design/figma/manifest.yaml`](../../frontend/design/figma/manifest.yaml) — screen inventory
- [`docs/frontend/brand.md`](../brand.md) — token reference
- [`docs/frontend/screen-map.md`](../screen-map.md) — PRD → code mapping (update Figma column as node IDs are filled in)
- [`docs/adr/ADR-002-figma-design-ground-truth.md`](../../docs/adr/ADR-002-figma-design-ground-truth.md)

## Test plan

- After each screen: `cd frontend && npx tsc --noEmit` — zero new errors.
- Visual check in Expo Go against the Figma frame (side-by-side review).
- Accessibility: at minimum verify contrast with a browser tool or `react-native-accessibility-checker` once wired.
- Prototype smoke test after each change: launch `npx expo start`, navigate the full HTML flow to confirm nothing is broken.
