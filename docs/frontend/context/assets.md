# Context: assets

Static media and bundled prototype HTML.

## Layout

| Path | Contents |
|------|----------|
| `frontend/assets/images/` | App icons, logos, product/scene images |
| `frontend/assets/images/screens/` | Native session-setup guide illustrations + permission graphics + celebration assets + photo checkpoint/submitted/missed backgrounds + submission confirmation photo previews (`submission-photo-1.png` … `submission-photo-4.png`) |
| `frontend/assets/animations/` | Motion exports — `photo-submitted-success.gif` (512×512 checkmark hero), `missed-checkpoint.json` |
| `frontend/assets/figma/home-screen/nav/` | Raw Figma navbar SVG exports (source for `src/components/navigation/icons/*.tsx`) |
| `frontend/assets/figma/session-setup/` | Figma SVG exports for session setup form (`calendar.svg`, `info-circle.svg`, `back-chevron.svg`) |
| `frontend/assets/figma/live-session/` | Figma SVG exports for live tracker map controls, weather, and action CTAs (`layers.svg`, `weather.svg`, `my-location.svg`, `submit-photo-camera.svg`, `end-session-stop.svg`) |
| `frontend/assets/stitch/` | Stitch HTML screens bundled into the app (**legacy — frozen**) |
| `frontend/assets/expo.icon/` | iOS app icon asset catalog |
| `frontend/design/` | Design-time artifacts (not all bundled into the app) |
| `frontend/design/figma/` | **Figma ground-truth workspace** — manifest, page notes, token exports |
| `frontend/design/stitch_htmls/` | Stitch HTML source files (**legacy — frozen**) |
| `frontend/design/html_prototype/` | Processed HTML prototype copies (**legacy — frozen**) |
| `frontend/design/tokens/` | Tailwind token config (Stitch-era, superseded by Figma variables) |

## Patterns

- **Active (Figma-to-native path):** Figma cloud → `design/figma/manifest.yaml` → RN screen at `src/app/<routeKey>.tsx`
- **Legacy (frozen):** Stitch → `design/stitch_htmls/` → scripts → `assets/stitch/` → WebView prototype at `/prototype/[screen]`
- Prototype HTML consumed via `require('../../../assets/stitch/<name>.html')` from `src/app/prototype/` — do not add new entries

## Policies

- Do not commit generated secrets or credentials alongside assets
- Keep filenames stable when registered in `HTML_MAP` — renames break `require()` keys
- **Do not add new screens to `HTML_MAP`.** New screens are registered in `frontend/design/figma/manifest.yaml` and implemented as native RN
- The `.fig` Figma binary is never committed — the cloud file is canonical
- Large binary exports (PNG/SVG) go in `design/figma/exports/`; only commit when needed for offline review
