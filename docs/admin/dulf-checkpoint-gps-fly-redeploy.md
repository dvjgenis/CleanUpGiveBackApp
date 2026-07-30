# Dulf — Redeploy Fly for checkpoint GPS (trail photo pins)

**Audience:** Dulf (ops / deploy)  
**Date:** 2026-07-30  
**Why:** New cleanup checkpoint photos should store **latitude / longitude** so the web-app Walking Path map can pin photo thumbnails on the real trail (not only a time-based guess).

**Already done (Shiv):** Supabase migration [`admin/db/007_checkpoint_coordinates.sql`](../../admin/db/007_checkpoint_coordinates.sql) has been run on the shared project (`checkpoints.latitude`, `checkpoints.longitude`).

**Your job:** Redeploy the Fly sessions API so `POST /sessions/:id/checkpoints` can write those columns. Secrets do **not** need to change.

Related: [dulf-resend-supabase-fly.md](dulf-resend-supabase-fly.md) (full Fly setup), [accounts-and-access.md](../accounts-and-access.md).

---

## 1. Pull latest code

```bash
cd /path/to/CleanUpGiveBackApp
git pull
```

Confirm these exist / are updated:

- `backend/sessions/prisma/schema.prisma` — `Checkpoint` has `latitude` / `longitude`
- `backend/sessions/src/routes/sessions.ts` — checkpoint POST accepts optional `latitude` / `longitude`
- `admin/db/007_checkpoint_coordinates.sql` — migration file (already applied in Supabase)

---

## 2. Install Fly CLI + login (if needed)

```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
fly auth login
```

App: **`cleanup-sessions`** → https://cleanup-sessions.fly.dev

---

## 3. Deploy

```bash
cd backend/sessions
fly deploy
```

Health check:

```bash
curl -s https://cleanup-sessions.fly.dev/health
```

Expect something like `{"status":"ok"}`.

If the deploy fails, send logs:

```bash
fly logs -a cleanup-sessions
```

---

## 4. Smoke test (after deploy)

| Step | How | Expect |
|------|-----|--------|
| 1 | Start a short cleanup in the **mobile app** (Expo pointing at `https://cleanup-sessions.fly.dev`) | Session starts normally |
| 2 | Submit at least one selfie + progress checkpoint outdoors (GPS on) | Checkpoint succeeds |
| 3 | In Supabase → **Table Editor** → `checkpoints` → newest row | `latitude` and `longitude` are **non-null** numbers |
| 4 | Open that session in **web-app** → Walking Path | Photo thumbnail sits on the polyline near where it was taken |

**Note:** Older sessions keep `NULL` lat/lng; the web-app still shows thumbs via time-along-route placement. Only **new** checkpoints after this deploy get real GPS pins.

---

## 5. If something is wrong

| Symptom | Check |
|---------|--------|
| Deploy OK but lat/lng still NULL on new rows | Mobile build/bundle includes checkpoint GPS send (`addCheckpoint` body). Confirm app `EXPO_PUBLIC_API_URL` is Fly, not an old local API. |
| API 500 on checkpoint create | Fly logs; confirm `007` columns exist in Supabase (`latitude` / `longitude` on `public.checkpoints`). |
| Thumbs missing entirely | Separate from Fly — web-app needs `SUPABASE_SERVICE_ROLE_KEY` to sign `session-photos`. That already works without this redeploy. |

---

## Out of scope for this task

- No new Fly secrets
- No Vercel redeploy required for GPS write-path (web-app already prefers stored coords when present)
- No backfill of historical checkpoints
