# Context: sessions

Session lifecycle, photo checkpoints, and activity tracking.

## Purpose

Core domain for cleanup sessions: setup, live tracking, photo evidence, submission, and approval. Native screens cover session setup, live session, photo checkpoint, submission confirmation, and sessions list/detail in `frontend/src/app/`.

**Architecture:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md)  
**API spec:** [sessions-api.md](../specs/sessions-api.md)  
**Setup:** [supabase.md](../../supabase.md)

## API surface (planned)

Fastify service in `backend/sessions/` on Fly.io:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Fly health check |
| POST | `/sessions` | Create + start session |
| POST | `/sessions/:id/checkpoints` | Record photo checkpoint metadata |
| PATCH | `/sessions/:id/finalize` | End session → `under_review` |
| GET | `/sessions` | List user's sessions |
| GET | `/sessions/:id` | Session detail + checkpoints |
| PATCH | `/sessions/:id/approval` | Admin status change |

Auth: Supabase JWT (`Authorization: Bearer`). Anonymous users OK for test phase.

## Data model (planned)

- **`sessions`** — lifecycle, route jsonb polyline, duration (wall-clock `started_at` → `ended_at`), distance, status enum (`active` → `under_review` → `approved` / `not_approved` / `invalid`)
- **`checkpoints`** — selfie/progress Storage paths, `captured_at`, `submitted_early`
- **Storage bucket `session-photos`** — private; client uploads; API stores paths only

Full schema: [supabase.md](../../supabase.md) §2.

## Integrations

- **Supabase** — Postgres (via Prisma), Auth (anonymous JWT), Storage (photo evidence)
- **Fly.io** — API hosting
- **Frontend** — `liveSessionStore` wires `startNewLiveSession` / `addPhotoCheckpoint` / `finalizeLiveSession` to API; `expo-location` + `expo-camera` already configured in `app.json`
- **Maps** — geolocation is client-owned; route persisted on finalize (no separate maps service for v1). See [maps.md](maps.md).

## Policies

- RLS: users read/write own sessions and checkpoints only
- GPS sampling only while session is `active` (`liveSessionStore.endLiveSession` stops `watchPositionAsync`)
- `service_role` key only on Fly — never in client or docs
- Retention / deletion / minor protection: [privacy-and-data-rights.md](../specs/privacy-and-data-rights.md)

## Related

- Code: `backend/sessions/` — Fastify + Prisma API (Fly deploy pending org machine limit)
- Frontend store: `frontend/src/features/session-tracking/liveSessionStore.ts`
- Frontend spec: [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)
