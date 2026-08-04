# Accounts and access

Org-owned accounts for this project. **Do not store secrets, API keys, or passwords in the repo.**

| Service | Purpose | Notes |
|---------|---------|-------|
| Expo / EAS | App builds, OTA, Expo Go testing | Org account; `eas.json` configured; **EAS development build required** for native MapLibre and **background GPS while session active** (`expo-task-manager`). Checkpoint capture uses **`expo-camera`** (works in Expo Go). **Expo Go on a physical device:** [expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md) — `npm start` (tunnel), `start:lan`, `start:device`. |
| Supabase | Auth (anonymous), Postgres, Storage | Project created; setup guide: [supabase.md](supabase.md) |
| Fly.io | Sessions API hosting | Install CLI: `curl -L https://fly.io/install.sh \| sh` then `fly auth login`; deploy `backend/sessions/` when implemented |
| Vercel | Web app hosting | Project `cleanupgiveback-web-app` → https://cleanupgiveback-web-app.vercel.app. **Auto-deploy:** GitHub Action [`.github/workflows/deploy-admin-web-app.yml`](../.github/workflows/deploy-admin-web-app.yml) on push to `main` (paths under `admin-web-app/`). Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Manual: `cd admin-web-app && vercel --prod`. Native Git integration isn’t used — repo is personal-owned (`dvjgenis`) and collaborators can’t connect it. Env vars in Vercel dashboard; `BYPASS_AUTH=false` in production. |
| Apple Developer | iOS distribution (TestFlight) | Org account TBD; not required for Expo Go testing |
| Google Play | Android distribution | Org account TBD; not required for Expo Go testing |
| Map provider | Live session map tiles | **Carto Voyager / Dark Matter** (Standard light/dark) + **Esri** (Satellite / Hybrid) via MapLibre — no API key for v1 |
| Weather | Live session navbar | **Open-Meteo** — no API key |
| Google Cloud | — | Not used for session tracking v1; defer until push notifications or Google geocoding needed |
| Resend | Transactional email | Domain `cleanupgiveback.org` **verified** (2026-08-03); smoke-tested. Local: `admin-web-app/.env.local` (`RESEND_API_KEY`, `EMAIL_FROM`, `DONNA_EMAIL`). Fly `cleanup-sessions`: same three secrets **deployed**. **Optional next:** add the same vars on Vercel (`cleanupgiveback-web-app`) for production admin emails. Runbook: [admin/dulf-resend-supabase-fly.md](admin/dulf-resend-supabase-fly.md). |
| Payments | Shop and donations | **Stripe — next up** (not implemented; UI/mock only; `backend/payments/` empty) |

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
| `admin/.env.local` | **Unused** (admin app archived) — prefer `admin-web-app/.env.local` |
| `admin-web-app/.env.local.example` | Template for `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY` + `BYPASS_AUTH` — same Supabase project as mobile — plus `RESEND_API_KEY`/`EMAIL_FROM`/`DONNA_EMAIL` and optional `SESSIONS_API_URL`/`ADMIN_API_KEY` (letterhead PDF proxy) |
| `admin-web-app/.env.local` | Local web-app Supabase + Resend values (gitignored); without Supabase keys, pages fall back to mock fixtures; without Resend, emails soft-skip |
| `admin/db/*.sql` | Additive Postgres migrations for the shared Supabase project (Dashboard → SQL Editor). Kept under archived `admin/` on purpose. `001` creates `public.events`; `005_events_image_urls_and_seed.sql` adds `image_urls` + storage policies; **`007_checkpoint_coordinates.sql`** adds `checkpoints.latitude` / `longitude` for trail photo pins. |
| `credentials.local.md` | **Admin sample login** (gitignored) — email `donnaadam@cleanupgiveback.org`, password `LocalAdmin!2026`, plus `BYPASS_AUTH` instructions. See also [admin sample login](#admin-portal-sample-login) below. |
| Fly secrets | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `DONNA_EMAIL` (deployed); add `SUPABASE_SERVICE_ROLE_KEY` / `ADMIN_API_KEY` when letterhead/admin API needs them — `fly secrets set` |

## Admin portal sample login

**Legacy `admin/` app is archived** — use the web app:

Local web app: `cd admin-web-app && npm run dev` → http://localhost:3000  
Production (web-app): https://cleanupgiveback-web-app.vercel.app

| Mode | How |
|------|-----|
| Bypass (local only) | `BYPASS_AUTH=true` in `admin-web-app/.env.local` — never enable on Vercel production long-term |
| Real login | Email/password in **`credentials.local.md`** (gitignored). Create the Supabase user with `user_metadata.role = 'admin'` once. Add `https://cleanupgiveback-web-app.vercel.app/**` to Supabase Auth → URL Configuration → Redirect URLs. |

### Account settings (`/account`)

Donna can update **name**, **email**, and **password** from Account when signed in with real auth (`BYPASS_AUTH` off):

| Field | Persistence |
|-------|-------------|
| Name | Supabase `user_metadata.full_name` (sidebar + Account header refresh after save) |
| Email | `supabase.auth.updateUser({ email })` — may require inbox confirmation depending on Supabase Auth settings |
| Password | Requires current password; then `updateUser({ password })` (min 8 chars) |

Do not commit production passwords. Org phone/address/title defaults for the Account page come from `ADMIN_ORG_PHONE` / `ADMIN_ORG_ADDRESS` / `ADMIN_DISPLAY_TITLE` / `DONNA_EMAIL` env vars when metadata is unset.

**Ops runbook (Resend + Supabase + Fly):** [admin/dulf-resend-supabase-fly.md](admin/dulf-resend-supabase-fly.md)

See [supabase.md](supabase.md) for full env var table and rotation steps.

## Architecture references

- Sessions backend: [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md)
- Expo Go map: [ADR-005](adr/ADR-005-expo-go-webview-map.md)
