# Context: sessions

Session lifecycle, photo checkpoints, and activity tracking.

## Purpose

Core domain for cleanup sessions: setup, live tracking, photo evidence, submission, and approval. Native screens cover session setup, live session, photo checkpoint, submission confirmation, and sessions list/detail in `frontend/src/app/`.

**Architecture:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md)  
**API spec:** [sessions-api.md](../specs/sessions-api.md)  
**Setup:** [supabase.md](../../supabase.md)

## API surface (live)

Fastify service in `backend/sessions/` on Fly.io (`https://cleanup-sessions.fly.dev`):

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Fly health check |
| POST | `/sessions` | Create + start session |
| POST | `/sessions/:id/checkpoints` | Record photo checkpoint metadata |
| PATCH | `/sessions/:id/finalize` | End session → `under_review` or `invalid` |
| GET | `/sessions` | List user's sessions (includes `checkpointCount` / `photoCount`) |
| GET | `/sessions/:id` | Session detail + checkpoints |
| PATCH | `/sessions/:id/approval` | Admin status change |

Auth: Supabase JWT verified via JWKS (ES256). Requires `SUPABASE_URL` + `DATABASE_URL` (Supabase Postgres) on Fly.

## Data model

- **`sessions`** — lifecycle, route jsonb polyline, duration (wall-clock `started_at` → `ended_at`), distance, status enum (`active` → `under_review` → `approved` / `not_approved` / `invalid`)
- **`checkpoints`** — selfie/progress Storage paths, `captured_at`, `submitted_early`
- **Storage bucket `session-photos`** — private; client uploads; API stores paths only
- **List enrichment:** `GET /sessions` returns `checkpointCount` and `photoCount` (`checkpointCount * 2`) for Home impact hydration

Full schema: [supabase.md](../../supabase.md) §2.

## Integrations

- **Supabase** — Postgres (via Prisma), Auth (anonymous JWT), Storage (photo evidence)
- **Fly.io** — API hosting
- **Frontend** — `liveSessionStore` wires `startNewLiveSession` / `addPhotoCheckpoint` / `finalizeLiveSession` to API (local session activates immediately; remote create is best-effort); missed checkpoint → `finalizeLiveSession({ status: 'invalid' })`
- **Home stats** — `sessionStatsStore` + `homeDashboardStats.ts` hydrate from list `photoCount` / duration / miles
- **Maps** — geolocation is client-owned (Kalman + optional background while active); route persisted on finalize. See [maps.md](maps.md).
- **Camera** — VisionCamera sequential checkpoint capture (EAS); dual multi-cam path disabled pending native fix

## Policies

- RLS: users read/write own sessions and checkpoints only
- GPS sampling only while session is `active` (foreground + optional background; both stop on finalize/cancel)
- `service_role` key only on Fly — never in client or docs
- Retention / deletion / minor protection: [privacy-and-data-rights.md](../specs/privacy-and-data-rights.md)

## Related

- Code: `backend/sessions/` — Fastify + Prisma API deployed to Fly.io
- Frontend store: `frontend/src/features/session-tracking/liveSessionStore.ts`
- Frontend stats: `sessionStatsStore.ts`, `utils/homeDashboardStats.ts`
- Frontend spec: [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)
