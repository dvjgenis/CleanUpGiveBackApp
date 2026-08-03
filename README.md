<div align="center">

<img src="frontend/assets/images/icon.png" alt="Clean Up - Give Back" width="112" />

# Clean Up - Give Back

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Sanchez&weight=400&size=22&duration=3200&pause=1800&color=009540&center=true&vCenter=true&width=520&lines=Volunteer.+Track.+Give+back.;Community+cleanup+made+simple.)](https://github.com/dvjgenis/CleanUpGiveBackApp)

Monorepo for the Clean Up - Give Back mobile app and supporting services.

**Website:** [cleanupgiveback.org](https://cleanupgiveback.org/) — 501(c)(3) nonprofit (volunteer programs, events, donate, store)

<p>
  <img src="https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white" alt="Expo 54" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Expo_Router-6-009540?logo=expo&logoColor=white" alt="Expo Router" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" />
</p>

<p>
  <a href="https://cleanupgiveback.org/"><img src="https://img.shields.io/badge/Website-cleanupgiveback.org-009540" alt="Website" /></a>
  <img src="https://img.shields.io/badge/iOS-supported-lightgrey?logo=apple&logoColor=white" alt="iOS" />
  <img src="https://img.shields.io/badge/Android-supported-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/docs-living-009540" alt="Living docs" />
</p>

</div>

---

## Repository layout

| | Path | Purpose |
|:--:|------|---------|
| 📱 | [`frontend/`](frontend/) | Expo React Native app, UI, design assets, and tooling |
| 🖥️ | [`admin-web-app/`](admin-web-app/) | Next.js admin console (production on Vercel) |
| 🗄️ | [`admin/`](admin/) | **Archived** legacy admin portal — keep `admin/db/*.sql` migrations only; see [admin/README.md](admin/README.md) |
| ⚙️ | [`backend/`](backend/) | Backend services (sessions live; maps & payments planned) |
| 📚 | [`docs/`](docs/) | Living documentation, specs, ADRs, and agent context |
| 🧩 | [`.cursor/`](.cursor/) | Cursor IDE rules and hooks (stays at repo root) |

## Quick start

From the repo root:

```bash
npm install --prefix frontend
npm start
```

Or work directly inside `frontend/`:

```bash
cd frontend
npm install
npm start
```

Scan the QR code with **Expo Go**. **`npm start` uses tunnel by default** (works on Wi‑Fi, hotspot, or phone on cellular). Use **`npm run start:lan`** when the phone and Mac share the same Wi‑Fi and you want the fastest connection.

```bash
npm start              # default: tunnel (Wi‑Fi / hotspot / cellular)
npm run start:lan      # same Wi‑Fi only (fast LAN)
npm run start:device   # tunnel (alias)
npm run start:tunnel   # tunnel (alias)
```

See [docs/frontend/specs/expo-go-dev-networking.md](docs/frontend/specs/expo-go-dev-networking.md) for Wi‑Fi / hotspot / cellular testing.

## Frontend structure

- `frontend/src/app/` — Expo Router screens and navigation
- `frontend/src/components/` — shared UI components
- `frontend/assets/` — images, fonts, and bundled Stitch HTML screens
- `frontend/design/` — design tokens, Stitch exports, and HTML prototypes
- `frontend/prototype/` — TypeScript prototype screens (optional `EXPO_PROTOTYPE=1` mode)

## Documentation

Start at [docs/README.md](docs/README.md). Agent instructions live in [docs/agents/](docs/agents/).

## License

See [LICENSE](LICENSE).
