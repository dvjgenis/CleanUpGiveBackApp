# Brand

Visual identity for Clean Up - Give Back.

> **Design ground truth:** [Figma — CleanUpGiveBack](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) (Design System page `1:3`).
> Local workspace: [`frontend/design/figma/`](../../frontend/design/figma/README.md) · Screen manifest: [`manifest.yaml`](../../frontend/design/figma/manifest.yaml).

## Colors

Design tokens live in the Figma file ([Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)) across two variable collections:

**Primitives** (hidden from pickers, single `Value` mode):

| Primitive | Hex | Description |
|---|---|---|
| `green/500` | `#009540` | Forest green brand hue; source for primary actions and approved status |
| `green/50` | `#f7fff1` | Light green tint; approved chip and success surfaces |
| `gray/900` | `#1c1b1b` | Near-black neutral; source for primary body text |
| `gray/700` | `#3e4a3d` | Dark green-gray; source for tertiary text (supporting copy, nav inactive labels) |
| `gray/500` | `#6e7a6c` | Mid green-gray; borders, input active states, non-text contrast (not a text token) |
| `gray/300` | `#bdcaba` | Light green-gray; borders, outlines, placeholders |
| `gray/200` | `#e5e2e1` | Pale gray; selected chip borders and subtle dividers |
| `white` | `#ffffff` | Pure white; text on primary fills |
| `cream/50` | `#fcf9f8` | Warm off-white app canvas background |
| `lime/500` | `#c2d832` | Bright lime accent; highlights and vegetation motif |
| `amber/100` | `#ffddb5` | Pending status chip background |
| `amber/700` | `#835400` | Pending status chip text |
| `amber/500` | `#fcab29` | Pending status chip border |
| `red/50` | `#ffd9de` | Declined/error chip background |
| `red/600` | `#ba1a1a` | Declined chip text, validation errors, destructive actions |

**Semantic Color** (`Light` mode, aliases to primitives, CSS variable via `var(--color-*)` code syntax):

| Token | CSS var | Description |
|---|---|---|
| `color/primary` | `--color-primary` | Primary brand fill and stroke — CTAs, FAB, active indicators, focus rings |
| `color/bg/app` | `--color-bg-app` | Main screen background behind scrollable content |
| `color/bg/surface` | `--color-bg-surface` | Elevated surface fill for cards, inputs, and list containers |
| `color/text/primary` | `--color-text-primary` | Default body and heading text on app and surface backgrounds |
| `color/text/tertiary` | `--color-text-tertiary` | Sole de-emphasized text token — captions, hints, metadata, section labels, nav inactive tab labels on app bg, surface, and white (8.90:1 on cream) |
| `color/text/on-primary` | `--color-text-on-primary` | Text and icons on primary (green) filled buttons and Track FAB |
| `color/border/outline` | `--color-border-outline` | Default border for inputs, cards, and list rows |
| `color/border/chip-selected` | `--color-border-chip-selected` | Border ring for selected filter chips |
| `color/accent/lime` | `--color-accent-lime` | Decorative lime accent; vegetation motif and emphasis highlights |
| `color/status/approved/*` | `--color-status-approved-{bg\|text\|border}` | Approved session chip colors |
| `color/status/pending/*` | `--color-status-pending-{bg\|text\|border}` | Pending / under-review chip colors |
| `color/status/declined/*` | `--color-status-declined-{bg\|text\|border}` | Declined / not-approved chip and error text |

## Typography

**Fonts in use:**

| Role | Font |
|------|------|
| Display / headings | Sanchez |
| Body | Noto Sans |
| Label / data | IBM Plex Sans |

Typography variables live in two Figma collections — **Typography Primitives** (raw families, weights, sizes) and **Typography** (semantic aliases per text style). CSS variable pattern: `var(--typography-{style}-{family|weight|size})`.

**Text styles (14):** Display/Hero · Headline/Page · Headline/Detail · Body/Default · Body/Large · Body/Small · Body/Emphasis · Body/Strong · Label/Overline · Label/Status · Label/Button · Nav/Tab · Data/Stat · Data/Timer

## Elevation

Shadows are used **only for structural chrome** — navbar and section headers. All other surfaces (cards, buttons, images, containers) use border contrast, not shadows. This keeps the UI flat and clean per PRD §11.7.

**2 active `Shadow/*` styles (applied to screens):**

| Figma style | CSS `box-shadow` equivalent | Applied to |
|---|---|---|
| `Shadow/Nav/Bottom` | `0 -4px 5px rgba(0,0,0,0.02)` | BottomNav — top-edge separator from content |
| `Shadow/Bar/Top` | `0 4px 5px rgba(0,0,0,0.15)` | TopAppBar — bottom-edge separator from content |

**Shadow color variables** (scope `EFFECT_COLOR`):

| Variable | Value |
|---|---|
| `black/alpha-2` | `rgba(0,0,0,0.02)` |
| `black/alpha-15` | `rgba(0,0,0,0.15)` |
| `color/shadow/strong` | alias → `black/alpha-15` |

**Foundations/Elevation swatch grid** lives on the [Design System page](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3) (node `708:48`) for reference.

## Accessibility (design reference)

WCAG 2.1 AA is the primary standard. Designer-facing rules live on the Figma Design System page **§10 · Accessibility foundations** ([`742:382`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=742-382)) and in **§3 Color Usage Rules** ([`742:361`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=742-361)). Full audit: [`docs/a11y-audit-2026-06-30.md`](../a11y-audit-2026-06-30.md).

Key rules: 44×44px minimum touch targets · `color/text/tertiary` as sole de-emphasized text · `green/500` not for normal-weight body text · `A11y/FocusRing` (2px primary, 2px offset) on all interactive Focus variants.

## Components

Use `ThemedView`, `ThemedText`, and shared theme hooks (`useColorScheme`, `useThemeColor`). See [context/components.md](context/components.md).

## Copy tone

- Clear, encouraging, community-focused
- Tagline: *Service tracking, simplified.*
