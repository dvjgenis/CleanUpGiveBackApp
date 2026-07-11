# Figma Tokens

Variable exports from the Figma Design System page ([`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)).

## Figma variable collections

| Collection | Modes | Description |
|-----------|-------|-------------|
| **Primitives** | `Value` | Raw hex values — hidden from pickers, aliased by Semantic Color |
| **Color** | `Light` | Semantic color aliases; CSS variable syntax (`--color-*`) |
| **Spacing** | `Value` | Spacing scale |
| **Radius** | `Value` | Border radius scale |
| **Typography Primitives** | `Value` | Raw font families, weights (`FONT_STYLE` strings), sizes |
| **Typography** | `Value` | Semantic aliases per text style × 3 properties (family, weight, size) |

Token count: **117 variables** (as of 2026-06-30; +13 `size/*` primitives added in text-token sweep for screen outliers: 9, 13, 15, 17, 19, 20, 24, 26, 30, 31, 32, 40, 50).

## How to export from Figma

1. Open the Figma file and go to the Design System page (`1:3`).
2. Use the Figma Variables plugin or the MCP `use_figma` skill to export collections.
3. Save output as JSON in this folder — one file per collection:
   - `primitives.json`
   - `color.json`
   - `spacing.json`
   - `radius.json`
   - `typography-primitives.json`
   - `typography.json`
4. Update `docs/frontend/brand.md` if any token values changed.

## Code syntax

Variables in the Figma file have WEB, iOS, and Android code syntax applied:

| Platform | Pattern |
|----------|---------|
| WEB | `var(--color-primary)`, `var(--typography-body-default-size)` |
| iOS | `Color.primary`, `Typography.bodyDefault.size` |
| Android | `R.color.primary`, `sp_body_default_size` |

## Current token source of truth

Until JSON exports are committed here, [`docs/frontend/brand.md`](../../../../docs/frontend/brand.md) is the authoritative token reference for implementation work.
