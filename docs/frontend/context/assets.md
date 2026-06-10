# Context: assets

Static media and bundled prototype HTML.

## Layout

| Path | Contents |
|------|----------|
| `frontend/assets/images/` | App icons, logos, product/scene images |
| `frontend/assets/stitch/` | Stitch HTML screens bundled into the app |
| `frontend/assets/expo.icon/` | iOS app icon asset catalog |
| `frontend/design/` | Design-time exports (not all bundled) |

## Patterns

- Prototype HTML consumed via `require('../../../assets/stitch/<name>.html')` from `src/app/prototype/`
- Design workflow: Stitch → `design/stitch_htmls/` → scripts → `assets/stitch/` and/or `design/html_prototype/`

## Policies

- Do not commit generated secrets or credentials alongside assets
- Keep filenames stable when registered in `HTML_MAP` — renames break `require()` keys
