# Clean Up - Give Back

Monorepo for the Clean Up - Give Back mobile app and supporting services.

## Repository layout

| Path | Purpose |
|------|---------|
| [`frontend/`](frontend/) | Expo React Native app, UI prototype, design assets, and tooling |
| [`backend/`](backend/) | Backend services (maps, payments, session tracking) — planned |
| [`docs/`](docs/) | Living documentation, specs, ADRs, and agent context |
| [`.cursor/`](.cursor/) | Cursor IDE rules and hooks (stays at repo root) |

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
