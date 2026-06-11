# Frontend

Expo React Native app for Clean Up - Give Back.

## Setup

```bash
npm install
npm start          # --lan: required for Expo Go on a physical device
# npm run start:tunnel   # if LAN / firewall blocks the connection
```

From repo root: `npm start` (delegates here).

## Layout

| Path | Purpose |
|------|---------|
| `src/app/` | Expo Router routes |
| `src/components/` | Shared UI |
| `src/hooks/`, `src/constants/` | Theme and utilities |
| `assets/` | Images and bundled Stitch HTML |
| `design/` | Tokens, Stitch exports, HTML prototypes |
| `prototype/` | TypeScript prototype (`EXPO_PROTOTYPE=1`) |
| `scripts/` | Import/link tooling for Stitch HTML |

## Docs

- [docs/frontend/](../docs/frontend/) — specs, brand, context
- [docs/current.md](../docs/current.md) — what runs today

## Typecheck

```bash
npx tsc --noEmit
```

Note: `prototype/` may report pre-existing NativeWind/className errors; the shipped app uses `src/app/`.
