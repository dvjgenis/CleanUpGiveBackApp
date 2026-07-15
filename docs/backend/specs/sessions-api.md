# Backend spec: Sessions API

**Date:** 2026-07-13  
**Status:** Draft — engineering requirements  
**ADR:** [ADR-004](../../adr/ADR-004-sessions-backend-supabase-fly.md)  
**Setup:** [supabase.md](../../supabase.md)  
**Frontend:** [session-tracking-expo-go.md](../../frontend/specs/session-tracking-expo-go.md)

## Summary

Fastify + Prisma sessions service on Fly.io. Persists cleanup session lifecycle, GPS route polyline, and photo checkpoint metadata. Supabase Postgres is the database; Supabase Auth JWTs authenticate requests; photo binaries upload directly from the client to Supabase Storage.

## API contract

Base URL: `EXPO_PUBLIC_API_URL` (e.g. `https://cleanup-sessions.fly.dev`).

All authenticated routes require:

```
Authorization: Bearer <supabase_access_token>
```

### Endpoints

#### `GET /health`

- **Auth:** none
- **Response:** `200 { "status": "ok" }`
- **Purpose:** Fly health check

#### `POST /sessions`

Create and start a session.

- **Body:**
  ```json
  {
    "activity": "Trash Clean Up",
    "courtOrdered": false,
    "description": "Park cleanup",
    "date": "2026-07-13"
  }
  ```
- **Response:** `201 { "id": "<uuid>", "status": "active", "startedAt": "<iso8601>" }`
- **Side effects:** inserts `sessions` row with `status = active`, `started_at = now()`, `user_id` from JWT

#### `POST /sessions/:id/checkpoints`

Record checkpoint metadata after client uploads photos to Storage.

- **Body:**
  ```json
  {
    "selfiePath": "{user_id}/{session_id}/{checkpoint_id}-selfie.jpg",
    "progressPath": "{user_id}/{session_id}/{checkpoint_id}-progress.jpg",
    "capturedAt": "<iso8601>",
    "submittedEarly": true
  }
  ```
- **Response:** `201 { "id": "<uuid>" }`
- **Validation:** session must belong to caller and be `active`

#### `PATCH /sessions/:id/finalize`

End session and submit for review.

- **Body:**
  ```json
  {
    "endedAt": "<iso8601>",
    "durationSeconds": 3600,
    "distanceMiles": 1.2,
    "route": [[-122.4, 37.8], [-122.41, 37.81]]
  }
  ```
- **Response:** `200 { "id": "<uuid>", "status": "under_review" }`
- **Side effects:** sets `ended_at`, duration, distance, route jsonb; `status → under_review`
- **Duration:** server computes `duration_seconds` from `started_at` and request `endedAt` (client `durationSeconds` is ignored when `started_at` is set)

#### `GET /sessions`

List caller's sessions (newest first).

- **Query:** `status` (optional filter), `limit` (default 50), `offset` (default 0)
- **Response:** `200 { "sessions": [ … ] }`

#### `GET /sessions/:id`

Session detail including checkpoints.

- **Response:** `200 { "session": { … }, "checkpoints": [ … ] }`
- **Validation:** session must belong to caller

#### `PATCH /sessions/:id/approval`

Admin status change (test phase: manual curl or Supabase table editor).

- **Body:** `{ "status": "approved" | "not_approved" | "invalid" }`
- **Auth:** admin role or service_role (implementation TBD for v1)
- **Response:** `200 { "id": "<uuid>", "status": "<new_status>" }`

## Data model

### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | RLS: `auth.uid() = user_id` |
| `activity` | text | |
| `court_ordered` | boolean | |
| `description` | text | |
| `started_at` | timestamptz | set on create |
| `ended_at` | timestamptz | set on finalize |
| `duration_seconds` | int | Server-derived from `started_at` → `ended_at` on finalize |
| `distance_miles` | numeric | |
| `route` | jsonb | `[[lng, lat], …]` polyline |
| `status` | enum | `active` → `under_review` → `approved` / `not_approved` / `invalid` |
| `created_at` | timestamptz | |

### `checkpoints`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `selfie_path` | text | Storage path, not URL |
| `progress_path` | text | Storage path |
| `captured_at` | timestamptz | |
| `submitted_early` | boolean | true if before 30-min countdown |

### Storage: `session-photos`

Private bucket. Path: `{user_id}/{session_id}/{checkpoint_id}-selfie.jpg`.

## Acceptance criteria

- [ ] **AC-1:** `POST /sessions` creates an `active` session tied to the JWT `user_id`
- [ ] **AC-2:** `POST /sessions/:id/checkpoints` stores metadata; rejects if session not `active` or not owned
- [ ] **AC-3:** `PATCH /sessions/:id/finalize` sets `under_review` with route, duration, distance
- [ ] **AC-4:** `GET /sessions` and `GET /sessions/:id` return only the caller's data (RLS + API check)
- [ ] **AC-5:** Anonymous Supabase users can create sessions (test phase)
- [ ] **AC-6:** GPS route stored as jsonb `[[lng, lat], …]` matching `liveSessionStore` `RouteCoordinate` type
- [ ] **AC-7:** Photo binaries never pass through Fly — client uploads to Storage; API stores paths only
- [ ] **AC-8:** Session ends with `invalid` status when missed-checkpoint flow triggers (client sends finalize with `invalid` or dedicated endpoint — align with frontend implementation)
- [ ] **AC-9:** `GET /health` returns 200 for Fly health checks

## Security & privacy

- JWT verification via Supabase JWT secret on Fly (see [supabase.md](../../supabase.md))
- RLS on `sessions` and `checkpoints` — users read/write own rows only
- `service_role` key only on Fly secrets — never in client or docs
- Session-only geolocation: client stops `watchPositionAsync` when session ends (`endLiveSession` in `liveSessionStore`)
- Retention, cascade deletion, minor protection: [privacy-and-data-rights.md](privacy-and-data-rights.md) (full ACs not blocking test phase)

## Test plan

1. Deploy API to Fly with secrets set per [supabase.md](../../supabase.md)
2. `curl GET /health` → 200
3. Obtain anonymous JWT from Supabase client; `POST /sessions` → 201
4. Upload test image to `session-photos`; `POST /sessions/:id/checkpoints` → 201
5. `PATCH /sessions/:id/finalize` with sample route → `under_review`
6. `GET /sessions/:id` → route + checkpoints present
7. Expo Go end-to-end: start session → walk → photo → end → kill app → reopen → session visible in list
