# ADR-002: Figma as Design Ground Truth

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The app initially used **Google Stitch** as the design-to-prototype pipeline: Stitch HTML screens were exported to `frontend/design/stitch_htmls/`, processed, and bundled into `frontend/assets/stitch/`. The Expo Router app loaded them in a WebView (`/prototype/[screen]`) with a JavaScript navigation bridge.

By mid-2026 all 39 screens had been exported from Stitch into the **CleanUpGiveBack Figma file** (`DrDcQH14n7ntDQ80F7au9S`) as real auto-layout frames across 6 flow pages. A Design System page (`1:3`) was built with 104 Figma variables, 14 text styles, and core components (BottomNav, Input). The Onboarding flow had full color and typography token binding applied.

The Stitch pipeline is now frozen. No new screens will be added to Stitch or to `HTML_MAP` in `[screen].tsx`.

## Decision

1. **Figma is the design ground truth** for all new and revised screens. The Figma cloud file is canonical; no `.fig` binary is committed to the repository.

2. **A local workspace at `frontend/design/figma/`** holds:
   - `manifest.yaml` — the screen inventory mapping Figma pages/nodes to future Expo Router `routeKey` values
   - `pages/` — per-flow notes for each of the 6 Figma pages
   - `tokens/` — Figma variable JSON exports when committed
   - `exports/` — PNG/SVG screen exports when committed
   - `components/` — Design System component documentation

3. **The HTML prototype remains runnable but is frozen.** The `[screen].tsx` route and all `HTML_MAP` entries continue to work for Expo Go demos until each screen is replaced by a native RN implementation. No new screens are added to `HTML_MAP`.

4. **The implementation path is Figma → RN per `manifest.yaml`.** Implementation is manual (engineer reads design in Figma, builds RN component against brand tokens). Figma-to-code automation (Code Connect, MCP code generation) is out of scope for v1 and can be introduced screen-by-screen.

5. **Migration is tracked via `status` in `manifest.yaml`**: `designed` → `bound` → `implemented`. The `/prototype/*` routes are deprecated for each screen once it reaches `implemented`.

## Consequences

- Implementers must consult `frontend/design/figma/manifest.yaml` and the Figma file before building any new screen.
- `docs/frontend/brand.md` remains the text-form token reference; it must stay in sync with Figma variables.
- The Stitch HTML pipeline docs (`frontend/design/stitch_htmls/`, `frontend/assets/stitch/`) are marked legacy. Existing files are not deleted — they support the running prototype.
- Future screens that have no Stitch counterpart (e.g. permission screens, session review) must be designed in Figma before being added to `manifest.yaml`.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep Stitch as design source | Stitch pipeline is unmaintained; Figma already has 39 screens + DS; moving back would discard DS work |
| Figma-to-code automation (Code Connect) immediately | Adds tooling complexity before any native screen exists; better as a follow-on once the DS is stable |
| Store Figma exports in `docs/` | `docs/` is for living text documentation; binary assets belong in `frontend/design/` per `assets.md` policy |
