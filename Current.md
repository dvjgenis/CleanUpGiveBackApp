# Current state — Clean-Up Give-Back

This document describes the **repository as it exists today** (May 2026): layout, what the code actually does, and what is still placeholder or missing relative to the product described in [README.md](./README.md).

## Repository layout

All app source and config live at the **repo root** (`CleanUpGiveBackApp/`), alongside `README.md` and `LICENSE`.

| Path | Role |
|------|------|
| `app/` | Expo Router screens and layouts |
| `app/(tabs)/` | Tab navigator: `index` (Home), `explore` (Developer docs—**dev-only** in the tab bar) |
| `components/` | Reusable UI (themed text/views, parallax header, links, collapsible sections, etc.) |
| `components/navigation/` | `TabBarIcon` for tabs |
| `components/__tests__/` | Jest snapshot test for `ThemedText` |
| `hooks/` | `useColorScheme` (incl. web variant), `useThemeColor` |
| `constants/Colors.ts` | Light/dark tint colors for tabs |
| `assets/` | Fonts (`SpaceMono`), images (icons, splash, template React artwork) |
| `scripts/reset-project.js` | Expo template script to archive starter `app` into `app-example` |
| `app.json` | Expo app name, bundle id `com.sanka233.CleanUpGiveBack`, EAS project id |
| `eas.json` | EAS profiles: `development` (dev client, iOS simulator), `preview`, `production` |
| `package.json` / `package-lock.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript strict mode, `@/*` path alias → repo root |
| `babel.config.js` | Babel config for Expo |

There is **no** nested `Clean-Up-Give-Back/` app folder anymore; clones should open the root and run `npm install` / `npx expo start` there.

## What runs today

- **Expo Router** root stack (`app/_layout.tsx`): loads fonts (`SpaceMono`), applies React Navigation light/dark theme, shows tab group and `+not-found`.
- **Tabs** (`app/(tabs)/_layout.tsx`):
  - **Home** (`index.tsx`) — **branded shell**: parallax header with the app icon, title “Clean-Up Give-Back”, copy about the nonprofit and roadmap, and **version** read from `expo-constants` (matches `app.json` / `package.json`, currently **0.0.1**).
  - **Developer** (`explore.tsx` — file name unchanged for Expo Router) — Expo starter reference (collapsibles, doc links). The tab bar entry uses **`href: null` when `__DEV__` is false** so **production builds only show Home**. If something still navigates to this route in a release build, the screen **redirects to** `/`. See the [README](./README.md#home-and-developer-tabs) section *Home and Developer tabs* for how to verify with a release build.
- **Theming** — `ThemedText` / `ThemedView`, `useColorScheme`, shared colors for active tab tint.
- **Tests** — one Jest snapshot test for `ThemedText` (`npm test`).
- **Native/tooling** — `expo-dev-client` in dependencies; EAS configuration present for future development/preview/production builds.

So: **you get a working Expo 51 + Router app** with a proper Home shell, but **no** domain flows yet (sessions, maps, auth, etc.).

## Product vs code (gaps)

These README goals are **not implemented** in this codebase yet (non-exhaustive):

- User authentication and roles (volunteer vs court-ordered vs admin)
- Firebase or any other backend, database, or cloud storage
- GPS / maps, geofencing, or route recording
- Camera / live selfie verification flows
- Timers tied to verified sessions
- PDF export, admin approval queues, payment/program fees
- In-app store or safety content beyond generic placeholders

**Firebase** is mentioned in older marketing-style docs but **does not appear** in `package.json` or source; there are **no** `google-services` / `GoogleService-Info` files in-repo.

## Template / branding leftovers

Worth cleaning up when you ship broader UX:

- **React**-branded images in `assets/images/` and references inside **`explore.tsx`** (Developer tab). Home uses `icon.png` only.
- Tab uses **construct** icons; content is still the upstream Expo template.
- **App icon / splash** are still default Expo artwork until design exports real brand assets.

**Aligned:** `package.json`, `app.json`, and the README/product label use version **0.0.1**. Deep link **`scheme`** is `cleanupgiveback` (replacing the old `myapp` default).

## Suggested next steps (engineering)

1. Add real flows after Home: sign-in → start cleanup / history (even as static wireframes first).
2. Add backend + auth (Firebase or alternative) and document env vars / secrets (never commit keys).
3. Add location and camera permissions in `app.json` / plugins when you implement those features.
4. Replace placeholder assets with Clean-Up Give-Back branding.
5. Align EAS `production` and store listing metadata with the final bundle id and app name.

---

*Last updated to match the flattened repo layout and dependencies as of this document’s creation.*
