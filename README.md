<h1 align="center">Clean-Up Give-Back</h1>

<p align="center">
  <img src="https://github.com/user-attachments/assets/e4cc36b4-f5d8-4ace-b828-5da0dec79107" alt="Clean-Up Give-Back logo" width="180" />
</p>

<p align="center">
  Mobile app for <strong>Clean Up - Give Back</strong>, an environmental nonprofit in Des Plaines, IL.
  The goal is to automate tracking of community service hours with location and activity verification,
  for both volunteers and court-ordered participants.
</p>

<p align="center">Version 0.0.1 (product vision) · see <a href="./docs/current.md">docs/current.md</a> for implementation status · <a href="./docs/README.md">docs index</a></p>

<p align="center">
  <a href="#what-were-building">What we’re building</a> ·
  <a href="#local-development">Local development</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#faq">FAQ</a>
</p>

---

## What we’re building

The app is intended to replace manual texting and photo submissions with a structured flow: verify who is on site, record time and route, capture cleanup evidence, and produce exports suitable for schools, employers, or courts.

### Planned capabilities

- **Authentication** — Sign-in for volunteers and court-ordered participants after **App Store / Play Store purchase** ($49.99 upfront; see [ADR-001](./docs/adr/ADR-001-upfront-app-store-monetization.md)).
- **Profile** — Participant identity (including ID), optional profile photo.
- **Cleanup session** — GPS during an active session, optional live selfie check-in, timer.
- **Activity log** — Post-cleanup photos, history of sessions (time, route, photos), PDF export.
- **Admin** — Review/approval for court hours, lockout when requirements are met.
- **Other** — In-app supplies, safety guidance.

Details of **what is coded today** versus **not started** live in [**docs/current.md**](./docs/current.md). Full context-engineering index: [**docs/README.md**](./docs/README.md).

## Local development

The app lives at the **repository root** (same folder as this `README.md`).

1. **Clone**

   ```bash
   git clone <repository-url>
   cd CleanUpGiveBackApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run Expo**

   ```bash
   npx expo start
   ```

   Then open the iOS simulator, Android emulator, web preview, or scan the QR code with [Expo Go](https://expo.dev/go). For full native modules later, follow [Expo’s environment setup](https://docs.expo.dev/get-started/set-up-your-environment/) (this repo includes `expo-dev-client` and EAS build profiles).

### Home and Developer tabs

- **Home** is always shown: product branding and status copy.
- **Developer** is the leftover Expo Router template screen (`app/(tabs)/explore.tsx`). It appears in the tab bar only while **`__DEV__` is true** (typical `npx expo start` workflow). In **release** builds it is hidden (`href: null`), and opening that route directly redirects to Home.

### Verifying the production tab bar

Locally you still see both tabs because development runs with `__DEV__ === true`. To confirm **Home-only** behavior, run a **release** native build (or install an EAS **production** / **preview** build), for example:

```bash
npx expo run:ios --configuration Release
# or
npx expo run:android --variant release
```

(You may need a [development or release setup](https://docs.expo.dev/workflow/overview/) appropriate to your machine; EAS Build is the usual path for CI and store-like binaries.)

### Useful scripts

| Command | Purpose |
|--------|--------|
| `npm start` | Start Metro / Expo dev server (`expo start`) |
| `npm run ios` | Start and target iOS |
| `npm run android` | Start and target Android |
| `npm run web` | Web build preview |
| `npm test` | Jest (with watch) |
| `npm run lint` | Expo lint |
| `npm run reset-project` | Moves current `app` to `app-example` for a blank slate (Expo template helper) |

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [Expo](https://expo.dev) SDK 51, [React Native](https://reactnative.dev) 0.74 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routes) |
| Language | TypeScript |
| Builds | [EAS Build](https://docs.expo.dev/build/introduction/) (`eas.json` + `app.json` `extra.eas`) |

Backend, auth, and maps are **not wired up yet**; see [docs/current.md](./docs/current.md).

## FAQ

### What problem does this solve?

Clean Up - Give Back today relies heavily on manual hour reporting. The app is meant to reduce admin work, cut errors, and improve verifiability of service.

### Who is it for?

Court-ordered participants and volunteers using the same core flows, with different policy rules (e.g. approvals) where needed.

### Will location run in the background forever?

The product intent is to track location **only during an active cleanup session**, not continuously.

### Is Firebase used in the repo today?

Not yet. **Google Firebase** (Auth, Firestore, Storage) is the planned backend for Phase 1; see [docs/specs/001-core-auth-profiles.md](./docs/specs/001-core-auth-profiles.md) and `.env.example`.

### How is the app paid for?

**$49.99 upfront** on the Apple App Store and Google Play Store. There is no in-app Stripe checkout (see [ADR-001](./docs/adr/ADR-001-upfront-app-store-monetization.md)).

### iOS and Android?

Yes—the Expo project targets both; web is also available for quick UI checks.

### Why do I see a “Developer” tab when I use Expo Go or Metro?

That tab is intentionally available in **development** so contributors can still read the Expo starter notes. It is **not** part of the tab bar in **release** builds. See [Home and Developer tabs](#home-and-developer-tabs) above.

## License

See [LICENSE](./LICENSE).
