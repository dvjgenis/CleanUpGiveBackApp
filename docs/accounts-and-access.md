# Accounts and access

Org-owned accounts for this project. **Do not store secrets, API keys, or passwords in the repo.**

| Service | Purpose | Notes |
|---------|---------|-------|
| Expo / EAS | App builds, OTA, Expo Go testing | Org account; `eas.json` configured; **EAS development build required** for native MapLibre and **background GPS while session active** (`expo-task-manager`). Checkpoint capture uses **`expo-camera`** (works in Expo Go). **Expo Go on a physical device:** [expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md) — `npm start` (tunnel), `start:lan`, `start:device`. |
| Supabase | Auth (anonymous), Postgres, Storage | Project created; setup guide: [supabase.md](supabase.md) |
| Fly.io | Sessions API hosting | Install CLI: `curl -L https://fly.io/install.sh \| sh` then `fly auth login`; deploy `backend/sessions/` when implemented |
| Apple Developer | iOS distribution (TestFlight) | Org account TBD; not required for Expo Go testing |
| Google Play | Android distribution | Org account TBD; not required for Expo Go testing |
| Map provider | Live session map tiles | **Carto Voyager / Dark Matter** (Standard light/dark) + **Esri** (Satellite / Hybrid) via MapLibre — no API key for v1 |
| Weather | Live session navbar | **Open-Meteo** — no API key |
| Google Cloud | — | Not used for session tracking v1; defer until push notifications or Google geocoding needed |
| Payments | Shop and donations | Stripe — out of scope for sessions test phase |

## EAS development build

Required for native MapLibre maps and background route tracking during active sessions. Expo Go uses foreground-only GPS, WebView maps, and **`expo-camera`** sequential checkpoint capture (no simultaneous dual-camera plugin).

1. Ensure `frontend/.env` has Supabase + `EXPO_PUBLIC_API_URL` (see [supabase.md](supabase.md)).
2. `cd frontend && eas build --profile development --platform ios` (and/or `android`)
3. Install the build on a physical device
4. `npm run start:dev-client` from repo root (or `cd frontend && npm run start:dev-client`) and open the dev client on the same network
5. Smoke test: follow [expo-go-eas-tester-runbook.md](frontend/specs/expo-go-eas-tester-runbook.md) — grant **Always** location → lock screen and verify route continues on EAS (gap expected in Expo Go only)

## Environment files

| File | Contents |
|------|----------|
| `frontend/.env.example` | Template for `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_API_URL` |
| `frontend/.env` | Local Expo values (gitignored) — **no** `DATABASE_URL` |
| `backend/sessions/.env` | `DATABASE_URL` (session pooler for local Prisma), optional service role for PDF dev (gitignored) |
| `admin/.env.local` | Supabase + `SESSIONS_API_URL` + `ADMIN_API_KEY` for letterhead proxy (gitignored) |
| `credentials.local.md` | **Admin sample login** (gitignored) — email `donnaadam@cleanupgiveback.org`, password `LocalAdmin!2026`, plus `BYPASS_AUTH` instructions. See also [admin sample login](#admin-portal-sample-login) below. |
| Fly secrets | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`, `RESEND_API_KEY`, `DONNA_EMAIL` — `fly secrets set` |

## Admin portal sample login

Local admin portal: `cd admin && npm run dev` → http://localhost:3001

| Mode | How |
|------|-----|
| Bypass | `BYPASS_AUTH=true` in `admin/.env.local` |
| Real login | Email/password in **`credentials.local.md`** (gitignored). Create the Supabase user with `user_metadata.role = 'admin'` once. |

Do not commit production passwords. Org phone/address for the Account page come from `ADMIN_ORG_PHONE` / `ADMIN_ORG_ADDRESS` / `DONNA_EMAIL` env vars.

**Ops runbook (Resend + Supabase + Fly):** [admin/dulf-resend-supabase-fly.md](admin/dulf-resend-supabase-fly.md)

See [supabase.md](supabase.md) for full env var table and rotation steps.

## Architecture references

- Sessions backend: [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md)
- Expo Go map: [ADR-005](adr/ADR-005-expo-go-webview-map.md)
