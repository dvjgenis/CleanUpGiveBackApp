# Assets

Two layers live under `assets/`:

| Path | Purpose |
|------|---------|
| **`brand/`** | Source brand kit — logos, letter templates, photography, decor, fonts. See [brand/README.md](./brand/README.md). |
| **`images/`** | Expo app icons, splash, favicon (bundled by Metro). |
| **`fonts/`** | Fonts loaded by the app today (e.g. SpaceMono). |

**Rule:** Add new org creative to `assets/brand/`. Copy optimized exports into `assets/images/` (or load from `brand/`) when wiring the app. Spec: [docs/context/assets.md](../docs/context/assets.md) · [docs/brand.md](../docs/brand.md).
