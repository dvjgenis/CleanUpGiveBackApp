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
npx expo start
```

Scan the QR code with **Expo Go** on a device on the same Wi-Fi network, or press `i` / `a` for simulators.

**Physical device won't connect?** If Expo shows `exp://127.0.0.1:8081`, your phone is trying to reach itself — not your Mac. Stop the server and restart with LAN mode (default after this fix), or use tunnel mode if you're on a restrictive network:

```bash
npm start              # uses --lan (your Mac's IP, e.g. exp://192.168.x.x:8081)
npm run start:tunnel   # routes through Expo's servers if LAN fails
```

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
