# Assets context — `assets/`

Brand kit and Expo-bundled media. Parent: [project.md](./project.md). Brand rules: [brand.md](../brand.md).

---

## Ontology

**Brand assets** — Source creative under `assets/brand/` (logo, imagery, decor, brand fonts). Organization-provided masters.

**App assets** — Files under `assets/images/` and `assets/fonts/` that Metro bundles for the running Expo app (icon, splash, runtime fonts).

**Logo master** — Highest-quality export in `assets/brand/logo/` used to generate app icons and marketing.

**Decor** — Non-photo graphics (patterns, illustrations) in `assets/brand/decor/` for UI chrome and empty states.

**Letter template** — HTML master, signature PNG, and letterhead in `assets/brand/letter/` for service confirmation PDFs (spec 003).

---

## Decisions

**[2026-06] Split brand vs app assets** — `assets/brand/` holds org source files; `assets/images/` holds Expo app icon/splash/favicon exports. Do not mix React template art into `brand/`.

**[2026-06] Docs for asset changes** — Structural or policy changes to folders or naming update this file and [brand.md](../brand.md) when usage rules change.

---

## Patterns

**Add new creative** → `assets/brand/<category>/` with kebab-case names (see [assets/brand/README.md](../../assets/brand/README.md)).

**Ship in app** → Optimize/copy from `brand/` into `assets/images/` or reference via `require()` / `expo-asset` as appropriate.

**Fonts** — Prefer `assets/brand/fonts/` when org supplies files; otherwise Google Fonts per brand book.

---

## Policies

**POLICY:** Do not commit copyrighted assets without permission; org-provided files only in `assets/brand/`.
**Why:** Legal and brand control.

**POLICY:** Remove Expo/React placeholder images from user-facing release paths when brand exports exist in `assets/brand/logo/`.
**Why:** Brand book requires official mark only.

**POLICY:** Large raw photos belong in `assets/brand/imagery/` — compress or resize before bundling into the app binary.
**Why:** App size and performance.

**POLICY:** Letter boilerplate and Donna Adam signature assets are org-authored only; app fills merge fields, never edits fixed legal text in UI.
**Why:** Spec 003 / court acceptance.

---

## Research

- [docs/brand.md](../brand.md) — colors, typography, logo clear space
- [assets/brand/letter/README.md](../../assets/brand/letter/README.md) — confirmation letter masters
- [assets/README.md](../../assets/README.md) — folder map
