# Accounts and access

Org-owned accounts for this project. **Do not store secrets, API keys, or passwords in the repo.**

| Service | Purpose | Notes |
|---------|---------|-------|
| Expo / EAS | App builds, OTA, Expo Go testing | Org account; `eas.json` configured; dev-client builds deferred for session test phase |
| Supabase | Auth (anonymous), Postgres, Storage | Project created; setup guide: [supabase.md](supabase.md) |
| Fly.io | Sessions API hosting | Install CLI: `curl -L https://fly.io/install.sh \| sh` then `fly auth login`; deploy `backend/sessions/` when implemented |
| Apple Developer | iOS distribution (TestFlight) | Org account TBD; not required for Expo Go testing |
| Google Play | Android distribution | Org account TBD; not required for Expo Go testing |
| Map provider | Live session map tiles | **Carto Positron** via MapLibre (native + WebView) — no API key for v1 |
| Weather | Live session navbar | **Open-Meteo** — no API key |
| Google Cloud | — | Not used for session tracking v1; defer until push notifications or Google geocoding needed |
| Payments | Shop and donations | Stripe — out of scope for sessions test phase |

## Environment files

| File | Contents |
|------|----------|
| `frontend/.env.example` | Template for `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_API_URL` |
| `frontend/.env` | Local values (gitignored) |
| `credentials.local.md` | Optional local secret reference (gitignored) |
| Fly secrets | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL` — set via `fly secrets set` |

See [supabase.md](supabase.md) for full env var table and rotation steps.

## Architecture references

- Sessions backend: [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md)
- Expo Go map: [ADR-005](adr/ADR-005-expo-go-webview-map.md)
