# Brand assets — Clean Up - Give Back

Drop official exports from the organization here. These are **source files** for design and app integration — not necessarily imported 1:1 by Expo.

## Folder layout

```
assets/brand/
├── letter/     Confirmation letter HTML, signature, letterhead (PDF export)
├── logo/       Primary mark, variants (light/dark), wordmark, app icon masters
├── imagery/    Photography, cleanup scenes, hero images
├── decor/      Patterns, backgrounds, illustrations, badges
└── fonts/      Sanchez, Noto Sans (.ttf / .otf) when provided by the org
```

## Naming

Use lowercase kebab-case with a role prefix:

| Example | Use |
|---------|-----|
| `logo-primary.png` | Main logo on white |
| `logo-primary.svg` | Vector master (preferred when available) |
| `logo-app-icon-1024.png` | App Store icon master |
| `imagery-cleanup-park-01.jpg` | Hero / marketing photo |
| `decor-leaf-pattern.svg` | UI background or section divider |

## Logo rules

From [docs/brand.md](../../docs/brand.md):

- **Clear space:** 5 px minimum on each side
- **Minimum display width:** 80 px (0.83 inch)
- Do not stretch, skew, or recolor outside brand palette

## App integration

When ready to ship branded UI:

1. Export app icon / splash from `logo/` masters → `assets/images/icon.png`, `splash.png`, `adaptive-icon.png`
2. Load brand fonts from `fonts/` or Google Fonts per brand book
3. Update `constants/Colors.ts` to Forest Green `#009540`

## Current status

Add files as the org provides them. Until then, the README logo URL in root `README.md` is the only checked-in reference image.
