# Supabase setup (sessions + geolocation)

Org-owned Supabase project for Auth, Postgres, and Storage. **Do not store secrets, API keys, or passwords in this repo.**

**Architecture:** [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md)  
**API contract:** [backend/specs/sessions-api.md](backend/specs/sessions-api.md)  
**Frontend spec:** [frontend/specs/session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md)

---

## 1. Project setup (dashboard)

1. Create a Supabase project under the org email.
2. **Authentication → Providers → Anonymous** — enable anonymous sign-in (test phase; no login screen).
3. Run the schema SQL below in **SQL Editor**.
4. Create a **private** Storage bucket `session-photos` with RLS (see §4).

---

## 2. Schema (v1)

```sql
create type session_status as enum
  ('active', 'under_review', 'approved', 'not_approved', 'invalid');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  activity text,
  court_ordered boolean default false,
  description text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  distance_miles numeric,
  route jsonb,
  status session_status default 'active',
  created_at timestamptz default now()
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  selfie_path text,
  progress_path text,
  captured_at timestamptz,
  submitted_early boolean default false
);

alter table public.sessions enable row level security;
alter table public.checkpoints enable row level security;

create policy "users_own_sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_checkpoints" on public.checkpoints
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
```

---

## 3. Environment variables

### Frontend (`frontend/.env` — copy from `frontend/.env.example`)

| Variable | Source | Notes |
|----------|--------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API → **Project URL** (e.g. `https://<ref>.supabase.co`) | **Not** the REST path (`/rest/v1`). Safe to ship in client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API → **anon public** JWT (`eyJ…`) | Not the publishable `sb_publishable_…` key. Safe to ship in client |
| `EXPO_PUBLIC_API_URL` | Fly app URL after deploy (e.g. `https://cleanup-sessions.fly.dev`) | Fly Fastify sessions API |

### Fly secrets (server only — never in repo)

Set after `fly auth login` and first deploy:

```bash
fly secrets set \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

| Secret | Source |
|--------|--------|
| `SUPABASE_URL` | Same as frontend Project URL — used for JWKS JWT verification |
| `DATABASE_URL` | Settings → Database → Connection string → URI (Supabase Postgres) |

Store real values in `credentials.local.md` (gitignored) or a password manager — **not** in `docs/`.

---

## 4. Storage bucket `session-photos`

- **Private** bucket; path convention: `{user_id}/{session_id}/{checkpoint_id}-selfie.jpg` and `…-progress.jpg`.
- Client uploads with the user's Supabase JWT; RLS policy restricts paths to the authenticated user's prefix.
- Fly API stores **paths only** in `checkpoints` — photos are not proxied through Fly.

---

## 5. Fly.io CLI

Install if `fly` is not found:

```bash
curl -L https://fly.io/install.sh | sh
# Add ~/.fly/bin to PATH, then:
fly auth login
```

Deploy from `backend/sessions/` when implemented (see [sessions-api.md](backend/specs/sessions-api.md)).

### Transactional email (Resend)

The sessions API also serves email routes (auth required):

| Route | Purpose |
|-------|---------|
| `POST /emails/event-registration` | Event Register confirmation |
| `POST /emails/email-change/request` | Send 6-digit code to new email |
| `POST /emails/email-change/confirm` | Validate code |

Fly secrets (do not commit):

- `RESEND_API_KEY` — Resend API key
- `EMAIL_FROM` — verified sender (default `noreply@cleanupgiveback.org`)

When `RESEND_API_KEY` is unset, routes return `{ ok: true, skipped: true }` (dev-safe).

---

## 6. Secret rotation (required if keys were exposed)

If service_role key, JWT secret, or database password appeared in chat, git history, or committed docs:

1. **Database password:** Settings → Database → Reset database password → update `DATABASE_URL` on Fly.
2. **JWT secret:** Settings → API → JWT Settings → Generate new secret → update `SUPABASE_JWT_SECRET` on Fly; all existing user sessions invalidate (anonymous users re-sign-in on next launch).
3. **Service role:** Cannot rotate independently — resetting JWT secret invalidates the service_role JWT as well; update `SUPABASE_SERVICE_ROLE_KEY` on Fly from the dashboard after rotation.

---

## 7. What does not need Supabase keys

| Capability | Provider | Key? |
|------------|----------|------|
| Map tiles (Expo Go WebView + native) | Carto / MapLibre GL | No |
| Live weather + reverse geocoding | Open-Meteo | No |
| Google Cloud Maps | — | Not used for session tracking in v1 |
