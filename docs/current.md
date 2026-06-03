# Current state — Clean-Up Give-Back

What the **repository does today** (May 2026) vs the product vision in the root [README.md](../README.md).

## Repository layout

App source and config at the **repo root** (`CleanUpGiveBackApp/`). Context-engineering docs in **`docs/`** — see [README.md](./README.md).

| Path | Role |
|------|------|
| `app/` | Expo Router screens and layouts |
| `app/(tabs)/` | Home + Developer (dev-only tab) |
| `components/` | Themed UI, parallax header, tab icons, tests |
| `hooks/`, `constants/` | Color scheme and theme |
| `assets/` | App bundle: `images/`, `fonts/` · Brand kit: `brand/{logo,imagery,decor,fonts}/` — [context/assets.md](./context/assets.md) |
| `docs/` | Context, specs, ADRs, plans |
| `app.json`, `eas.json`, `package.json` | Expo / EAS config |

No nested `Clean-Up-Give-Back/` folder. Clone root → `npm install` → `npx expo start`.

## What runs today

- **Expo Router** root stack with light/dark theme and `SpaceMono` font
- **Home tab** — branded shell, version **0.0.1** from `expo-constants`
- **Developer tab** — Expo template; tab bar entry only when `__DEV__`; redirects to `/` in release
- **Tests** — one Jest snapshot for `ThemedText`
- **Tooling** — `expo-dev-client`, EAS profiles configured

Working Expo 51 + Router shell; **no** domain flows yet (auth, sessions, maps, admin).

## Gaps (not implemented)

- User authentication and roles (volunteer vs court-ordered vs admin)
- Firebase or any backend
- GPS / maps / route recording
- Camera / live selfie verification
- Timers, activity logs, admin approval, confirmation letter PDF (specs 002–003)
- In-app store or safety content

Firebase is not in `package.json`; no `google-services` files in-repo.

## Template / branding leftovers

See [brand.md](./brand.md) for official colors, fonts, and logo rules.

- `assets/brand/` folders ready for logo, imagery, decor, and brand fonts (empty except README + `.gitkeep`)
- React-branded images in `assets/images/` and Developer tab (`explore.tsx`)
- Default Expo icon/splash — replace with brand exports per brand book
- `constants/Colors.ts` and SpaceMono font not yet aligned to Forest Green / Sanchez / Noto Sans

## Aligned decisions

- Version **0.0.1** · scheme **`cleanupgiveback`**
- Monetization: **$49.99 upfront** — [ADR-001](./adr/ADR-001-upfront-app-store-monetization.md)
- Phase 1 spec: [001-core-auth-profiles.md](./specs/001-core-auth-profiles.md)
- Env template: [`.env.example`](../.env.example)

## Next steps

1. Phase 1 — Firebase auth + profiles ([implementation-plan.md](./implementation-plan.md))
2. Write Phase 2 specs before GPS/camera work
3. Drop org logo/photos into `assets/brand/`; export app icon/splash to `assets/images/`
