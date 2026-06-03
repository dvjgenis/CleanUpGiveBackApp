# Clean Up - Give Back — Brand Book

Official brand reference for the **Clean Up - Give Back** mobile app, marketing, and UI. Source: organization brand book. Use this doc when choosing colors, type, tone, logo usage, or visual hierarchy.

**Organization:** 501(c)(3) nonprofit · Des Plaines, IL  
**Tagline:** *Making The Community Better!*

---

## 01 — Brand overview

Clean Up - Give Back creates a cleaner environment through **community engagement**, **large-scale cleanups**, and **specialized plastic recycling** initiatives.

The organization provides accessible volunteer opportunities for:

- Individuals
- Corporations
- Schools
- **Court-ordered community service** (flexible program — core audience for this app)

This app supports hour tracking and verification for volunteers and court-ordered participants; brand presentation should feel **trustworthy**, **inclusive**, and **action-oriented**, not corporate or punitive.

---

## 02 — Logo

### Primary logo

Official exports live in **`assets/brand/logo/`**. Add PNG/SVG masters from the organization there.

A reference image used in the root README (until masters are checked in):

`https://github.com/user-attachments/assets/e4cc36b4-f5d8-4ace-b828-5da0dec79107`

For app store icons and splash, derive optimized files from brand masters into `assets/images/` (see [assets/brand/README.md](../assets/brand/README.md)).

### Clear space

Always maintain clear space around the logo so it stays legible.

- **Minimum clear space:** **5 px** on each side (relative to the logo bounding box in the layout).

### Minimum size

Below minimum size, clarity is lost — do not scale smaller.

- **Minimum width:** **0.83 inch** or **80 px**

### Usage (app)

| Do | Don't |
|----|--------|
| Use on white or very light backgrounds | Stretch, skew, or rotate the logo |
| Respect clear space and minimum size | Place on busy photography without contrast |
| Use approved exports only | Recreate or approximate the mark in code |

---

## 03 — Typography

Typefaces carry **voice and tone**. Use hierarchy for readability across app screens, PDF exports, and web.

### Primary typeface — **Sanchez**

Use for **headlines**, **hero titles**, and **emphasis** (e.g. screen titles, marketing headers).

```
Sanchez
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789!@#$%
```

**React Native / Expo:** Load via `expo-font` + `@expo-google-fonts/sanchez` (or bundled `.ttf` from brand kit when provided).

### Secondary typeface — **Noto Sans**

Use for **body copy**, **forms**, **labels**, **buttons**, and **long-form text**.

```
Noto Sans
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789!@#$%
```

**React Native / Expo:** Load via `expo-font` + `@expo-google-fonts/noto-sans` (or bundled files from brand kit).

### Hierarchy (recommended)

| Level | Typeface | Typical use |
|-------|----------|-------------|
| Title / H1 | Sanchez | Screen titles, onboarding headers |
| Subtitle / H2 | Sanchez or Noto Sans Semibold | Section headers |
| Body | Noto Sans | Paragraphs, form help text |
| Caption / label | Noto Sans | Field labels, timestamps, legal fine print |

**Current codebase note:** The app still loads **SpaceMono** from the Expo template in `app/_layout.tsx`. Migrate to Sanchez + Noto Sans when implementing branded UI (see [current.md](./current.md)).

---

## 04 — Color palette

Colors express **personality** and must stay consistent across app, store listings, and print.

### Forest Green (primary brand)

| | Value |
|---|--------|
| **Hex** | `#009540` |
| **RGB** | `0, 149, 64` |
| **CMYK** | `100%, 0%, 57.05%, 41.57%` |
| **HSL** | `145.77°, 100%, 29.22%` |

**Use for:** Primary buttons, active states, key CTAs, brand accents, links (light mode), success/positive actions tied to cleanup progress.

### Pure White

| | Value |
|---|--------|
| **Hex** | `#FFFFFF` |
| **RGB** | `255, 255, 255` |
| **CMYK** | `0%, 0%, 0%, 0%` |
| **HSL** | `0°, 0%, 100%` |

**Use for:** Backgrounds (light mode), logo on green, card surfaces, inverse text on green buttons.

### Obsidian Black

| | Value |
|---|--------|
| **Hex** | `#161616` |
| **RGB** | `22, 22, 22` |
| **CMYK** | `0%, 0%, 0%, 91.37%` |
| **HSL** | `0°, 0%, 8.63%` |

**Use for:** Primary text (light mode), dark-mode backgrounds, high-contrast body copy.

### Suggested app mapping

| Token | Light mode | Dark mode |
|-------|------------|-----------|
| Background | `#FFFFFF` | `#161616` |
| Text primary | `#161616` | `#FFFFFF` |
| Brand / tint / CTA | `#009540` | `#009540` (or slightly lighter green for contrast on `#161616`) |
| Muted text | `#161616` at ~70% opacity | `#FFFFFF` at ~70% opacity |

**Current codebase note:** `constants/Colors.ts` still uses Expo template blues/grays. Align with this palette when refreshing UI.

### Accessibility

Ensure **WCAG 2.1 AA** contrast for text and controls. Forest Green on white and white on Forest Green generally work for large text and buttons; verify small body text and disabled states.

---

## 05 — Imagery

*(Brand book section — add official photography to `assets/brand/imagery/`.)*

**Direction until assets are supplied:**

- Show **real cleanup action**: volunteers, bags, parks, waterways, community groups.
- Prefer **authentic, diverse** participants (individuals, schools, corporate teams).
- Avoid stock clichés that feel staged or unrelated to Illinois/community cleanup.
- Court-ordered program imagery should feel **dignified and inclusive**, not stigmatizing.
- Store source files in **`assets/brand/imagery/`**; compress before bundling into the app.

**Decor / patterns:** `assets/brand/decor/` for backgrounds, dividers, and illustrations.

**In-app today:** Template React artwork remains in `assets/images/` and the Developer tab — replace per [current.md](./current.md).

---

## 06 — Brand voice

### Values

**Sustainability · Community engagement · Inclusion · Accessibility**

### Aesthetic / tone descriptors

| Dimension | Character |
|-----------|-----------|
| Overall | Community-driven, grassroots, action-oriented, eco-conscious, approachable |
| Voice | Encouraging, educational, compassionate, community-focused |

### Writing guidelines (app copy)

| Do | Don't |
|----|--------|
| Use plain language; explain verification steps calmly | Sound bureaucratic, punitive, or police-like toward court-ordered users |
| Celebrate impact (“hours logged,” “community cleaner”) | Shame or stereotype participants |
| Be clear about requirements (photos, GPS during session) | Hide rules in legal jargon |
| Emphasize accessibility and inclusion | Assume technical literacy |

### Example tone

- **Good:** “Start your cleanup when you’re on site. We’ll track time while you’re active and help you share verified hours with your program.”
- **Avoid:** “You must comply with monitoring or your hours will be rejected.”

---

## 07 — Service confirmation letter (PDF)

Formal letters for courts, schools, and employers are generated from a **fixed HTML template** in `assets/brand/letter/` with Donna Adam’s signature. The app fills participant name, email, crediting organization, and **approved** hours only.

See [spec 003](./specs/003-service-confirmation-letter.md) and [ADR-002](./adr/ADR-002-on-device-pdf-via-expo-print.md).

---

## Implementation checklist (engineering)

When applying this brand in the Expo app:

- [ ] Add logo masters to `assets/brand/logo/`; export to `assets/images/icon.png`, splash, adaptive icon
- [ ] Add photography to `assets/brand/imagery/` and decor to `assets/brand/decor/` as provided
- [ ] Add Sanchez + Noto Sans to `assets/brand/fonts/` or load via `@expo-google-fonts/*`
- [ ] Load fonts in `app/_layout.tsx`; update `ThemedText` styles
- [ ] Update `constants/Colors.ts` to Forest Green / White / Obsidian Black tokens
- [ ] Audit Home and future auth/session screens against voice guidelines above
- [ ] Remove Expo/React placeholder art from user-facing release builds
- [ ] Replace `letter-template.sample.html` with org-final letter + `signature-donna-adam.png` in `assets/brand/letter/`

---

## References

- [project context](./context/project.md) — product roles and policies
- [spec 003](./specs/003-service-confirmation-letter.md) — confirmation letter PDF
- [current.md](./current.md) — what is branded vs placeholder in code today
- Root [README.md](../README.md) — public project summary
