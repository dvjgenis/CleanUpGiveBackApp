# App context — Expo Router

Expo Router screens and navigation. Parent: [project.md](./project.md).

---

## Ontology

**Home tab** — Branded product shell (`app/(tabs)/index.tsx`). Always visible in the tab bar.

**Developer tab** — Expo template reference (`app/(tabs)/explore.tsx`). Tab bar entry only when `__DEV__` is true; redirects to `/` in release if navigated directly.

**Root stack** — `app/_layout.tsx` loads fonts, applies light/dark theme, hosts `(tabs)` and `+not-found`.

---

## Decisions

**[2026-05] Tab navigator for v0 shell** — `(tabs)` group with Home + Developer. Future auth and session flows will add stack screens (e.g. `(auth)/`, `(session)/`) — document new ADR when navigation structure changes materially.

**[2026-05] Deep link scheme** — `cleanupgiveback` in `app.json`.

---

## Patterns

**Layouts** — `_layout.tsx` per route group. Tab options in `app/(tabs)/_layout.tsx`.

**Screens** — Default export function components. Use `@/` imports for shared UI.

**New routes** — Add files under `app/` following Expo Router conventions; update this file when adding route groups.

---

## Policies

**POLICY:** Do not add continuous background location logic in `app/` screens — GPS belongs to active session flows only.
**Why:** Product and privacy requirement from [project.md](./project.md).

**POLICY:** Release builds must not expose Developer tab in the tab bar.
**Why:** End users should not see Expo starter documentation.

---

## Research

**Expo Router** — https://docs.expo.dev/router/introduction/
