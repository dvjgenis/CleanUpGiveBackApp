# Project context — Clean-Up Give-Back

Project-level vocabulary, decisions, and policies. Scoped details: [app.md](./app.md), [assets.md](./assets.md), [../specs/](../specs/).

---

## Ontology

**Participant** — Any signed-in user logging cleanup service hours through the app.

**Court-ordered participant** — Participant fulfilling a court mandate. Subject to stricter verification (interval live selfies, daily hour cap, admin approval before hours credit).

**Volunteer** — Participant who is not court-ordered (school, work, corporate, or public volunteer). Lighter policy rules; hours may not require admin approval.

**Admin / staff** — Internal nonprofit user who reviews session evidence and approves or rejects court-ordered logs.

**Session** — A bounded cleanup activity with a defined start and end, during which location may be recorded and live photos captured.

**Service hour** — Credited time derived from a completed, verified session (subject to rounding rules).

**Participant ID** — Unique identifier assigned at signup and stored on the user profile for external verification.

**Live capture** — Photo or selfie taken in-app at capture time; gallery uploads are not allowed for evidence.

**Approved session** — A cleanup session with status `approved` after admin review (spec 002); hours count toward verified totals and letter export.

**Confirmation letter** — Formal PDF from the org template (spec 003) with merge fields for participant name, email, crediting organization, and total approved hours; includes Donna Adam’s signature block.

**Crediting organization** — Court, school, employer, or other entity the participant serves hours toward (from profile at signup).

---

## Decisions

**[2026-05] Upfront store pricing ($49.99)** — No in-app Stripe checkout. Revenue via Apple App Store and Google Play upfront download price. Ref: [ADR-001](../adr/ADR-001-upfront-app-store-monetization.md).

**[2026-05] Firebase backend (planned)** — Auth, Firestore, and Storage for profiles, sessions, and evidence. Not wired in code yet.

**[2026-05] Session-scoped GPS only** — Location tracking runs only during an active session, not continuously in the background.

**[2026-05] Repo layout** — Expo app at repository root (`CleanUpGiveBackApp/`). No nested `Clean-Up-Give-Back/` folder.

**[2026-05] Docs layout** — Context-engineering docs live under `docs/` except root `README.md` and `.cursor/rules/`.

**[2026-05] Spec location** — Feature specs in `docs/specs/`. Template: `docs/specs/TEMPLATE.md`.

**[2026-06] Brand asset folders** — Org creative in `assets/brand/{logo,imagery,decor,fonts}`; Expo bundle assets in `assets/images/` and `assets/fonts/`. See [assets.md](./assets.md).

**[2026-05] Brand reference** — UI, copy, and tokens follow [brand.md](../brand.md) (Forest Green `#009540`, Sanchez + Noto Sans, official voice).

**[2026-06] Confirmation letter PDF** — On-device HTML template + `expo-print` (ADR-002). Template in `assets/brand/letter/`. Only **approved** hours on letter (spec 003).

---

## Patterns

**Expo Router** — File-based routes under `app/`. Tab group at `app/(tabs)/`.

**Themed UI** — Prefer `ThemedText`, `ThemedView`, `useColorScheme`, and `useThemeColor` over ad-hoc colors. Brand tokens: see [brand.md](../brand.md).

**Path alias** — `@/*` maps to the repository root.

**Dev-only Developer tab** — `app/(tabs)/explore.tsx` hidden from release tab bar (`href: null` when `!__DEV__`).

---

## Policies

**POLICY:** Evidence photos must be live capture only — no gallery picker for session proof.
**Why:** Prevents fraud and satisfies court/school verification requirements.

**POLICY:** Court-ordered sessions require admin approval before hours are officially credited.
**Why:** High-stakes users; nonprofit must audit GPS route and photos.

**POLICY:** Minimum session duration 20 minutes; smart rounding applies (e.g. 21 minutes may round to 30).
**Why:** Aligns with program rules documented by the nonprofit.

**POLICY:** Court-ordered users face a 5-hour daily cap and 1-hour interval live-selfie check-ins during sessions.
**Why:** Anti-fraud and compliance for mandated service.

**POLICY:** Never commit secrets — use `.env` (see `.env.example`). No `google-services.json` or API keys in git.
**Why:** Security and credential rotation.

**POLICY:** Monetization is store upfront pricing only — do not implement Stripe or in-app payment flows unless a new ADR supersedes ADR-001.
**Why:** ADR-001 is the current financial model.

**POLICY:** Official service confirmation letters may only include **admin-approved** hours; template wording and signature are org-fixed, not user-editable.
**Why:** Legal verification for courts and schools; prevents fraud.

**POLICY:** User-facing UI and copy must follow [brand.md](../brand.md) — colors, typography, logo rules, and compassionate community-focused voice (especially for court-ordered users).
**Why:** Brand consistency and inclusive tone are organizational requirements.

---

## Research

**Clean Up - Give Back brand** — Full brand book in [brand.md](../brand.md).

**Expo SDK 51 / React Native 0.74** — Current mobile stack. See root `README.md` and [current.md](../current.md).

**Google Firebase** — Planned Auth, Firestore, Storage. See [spec 001](../specs/001-core-auth-profiles.md) for Phase 1 scope.

**Service confirmation PDF** — [spec 003](../specs/003-service-confirmation-letter.md), [ADR-002](../adr/ADR-002-on-device-pdf-via-expo-print.md).
