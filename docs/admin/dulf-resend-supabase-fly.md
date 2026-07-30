# Setup runbook for Dulf — Resend, Supabase, Fly

**Audience:** Dulf (ops / deploy)  
**Project:** Clean Up – Give Back  
**Date:** 2026-07-28  

This guide covers the three services needed for **admin notifications**, **Donna’s admin login**, and the **sessions API** on Fly. Do **not** commit API keys or passwords to git. Store them in a password manager and/or gitignored `credentials.local.md` at the repo root.

Related docs:

- [supabase.md](../supabase.md) — full schema / env tables  
- [accounts-and-access.md](../accounts-and-access.md) — where env files live  
- [credentials.local.md](../../credentials.local.md) — local sample Donna login (gitignored; create if missing)  
- [refinement-contracts-2026-07-28.md](refinement-contracts-2026-07-28.md) — what emails/push fire when  

App URLs today:

| App | URL |
|-----|-----|
| Admin portal (local) | http://localhost:3001 |
| Sessions API (Fly) | https://cleanup-sessions.fly.dev |

---

## Checklist (order)

1. [ ] Supabase — confirm project, run SQL migrations, create Donna admin user, copy API keys  
2. [ ] Resend — create API key, verify sending domain (or use Resend onboarding domain for tests)  
3. [ ] Wire `admin/.env.local` and `frontend/.env`  
4. [ ] Fly — set secrets + redeploy `backend/sessions`  
5. [ ] Smoke tests below  

---

## 1. Supabase

### 1.1 Open the project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)  
2. Select the **Clean Up Give Back** org project (same one the mobile app uses)  
3. Note **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`  
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never put in the Expo app)

### 1.2 Run admin SQL (if not already)

In **SQL Editor**, run these files from the repo **in order** (skip any already applied):

| File | Purpose |
|------|---------|
| [`admin/db/001_admin_portal_migration.sql`](../../admin/db/001_admin_portal_migration.sql) | Admin tables/columns |
| [`admin/db/002_event_photos_bucket.sql`](../../admin/db/002_event_photos_bucket.sql) | `event-photos` Storage bucket |
| [`admin/db/003_event_image_urls.sql`](../../admin/db/003_event_image_urls.sql) | `events.image_urls` |
| [`admin/db/004_admin_refinements.sql`](../../admin/db/004_admin_refinements.sql) | `decline_reason`, court unique, notify history |
| [`admin/db/006_donations.sql`](../../admin/db/006_donations.sql) | `donations` table (Payments donation revenue) |

Also ensure Auth has **Anonymous** enabled if the mobile app still uses anon auth (**Authentication → Providers → Anonymous**).

### 1.3 Create Donna’s admin user

1. **Authentication → Users → Add user → Create new user**  
2. Email: `donnaadam@cleanupgiveback.org`  
3. Password: use the value in `credentials.local.md` (local default was `LocalAdmin!2026`)  
4. Turn **Auto Confirm User** **on**  
5. Open the user → set **User Metadata** to:

```json
{
  "role": "admin",
  "full_name": "Donna Adam"
}
```

The admin portal checks `user_metadata.role === 'admin'`. Without that claim, login shows **Access denied**.

### 1.4 Database connection string (for Fly / local Prisma)

**Settings → Database → Connect**:

- For **Fly**, direct or pooler URI usually works  
- For **local Mac Prisma**, prefer **Session pooler** (port 5432, `*.pooler.supabase.com`) if direct `db.<ref>.supabase.co` fails with P1001  

Append `?sslmode=require` if the URI does not include it.

---

## 2. Resend

Resend sends:

- Donna: “session ready for review” when a volunteer finalizes (Fly)  
- Volunteers: approved / declined emails (admin portal)  
- Event registration + notify-at-risk emails (existing)

### 2.1 Create an API key

1. Sign in at [https://resend.com](https://resend.com) (org account)  
2. **API Keys → Create**  
3. Copy the key → this is `RESEND_API_KEY`  
4. Store it in the password manager — do not commit it  

### 2.2 Sender address (`EMAIL_FROM`)

- Default in code: `noreply@cleanupgiveback.org`  
- For production: **Domains** in Resend → add/verify `cleanupgiveback.org` (DNS records Resend shows) → then set:

```text
EMAIL_FROM=noreply@cleanupgiveback.org
```

- For early testing without DNS: Resend allows sending from their onboarding/test sender only to your own account email. Prefer verifying the real domain ASAP.

### 2.3 Donna’s inbox (`DONNA_EMAIL`)

Set to the address that should receive “new session for review” alerts, e.g.:

```text
DONNA_EMAIL=donnaadam@cleanupgiveback.org
```

If `RESEND_API_KEY` or `DONNA_EMAIL` is missing, emails are **skipped** (logged) — the app does not crash.

---

## 3. Env files (local)

### 3.1 Admin — `admin/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...

# Auth: true = skip login; false = use Donna login
BYPASS_AUTH=false

# Letterhead PDF proxy → Fly
SESSIONS_API_URL=https://cleanup-sessions.fly.dev
ADMIN_API_KEY=generate-a-long-random-string

# Email
RESEND_API_KEY=re_...
DONNA_EMAIL=donnaadam@cleanupgiveback.org
EMAIL_FROM=noreply@cleanupgiveback.org

# Optional Account page org contact (avoids hardcoding PII in source)
# ADMIN_ORG_PHONE=
# ADMIN_ORG_ADDRESS=
# ADMIN_DISPLAY_NAME=Donna Adam
```

`ADMIN_API_KEY` must match the Fly secret of the same name.

Restart after edits:

```bash
cd admin && npm run dev
```

Login: http://localhost:3001/login with credentials from `credentials.local.md`.

### 3.2 Mobile — `frontend/.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
EXPO_PUBLIC_API_URL=https://cleanup-sessions.fly.dev
```

No service role key in the mobile app.

### 3.3 Backend local (optional) — `backend/sessions/.env`

Only needed to run the API on your laptop:

```bash
DATABASE_URL=postgresql://...pooler...
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_API_KEY=same-as-admin
RESEND_API_KEY=re_...
DONNA_EMAIL=donnaadam@cleanupgiveback.org
EMAIL_FROM=noreply@cleanupgiveback.org
```

---

## 4. Fly.io (sessions API)

App name / URL: **`cleanup-sessions`** → https://cleanup-sessions.fly.dev  

### 4.1 Install + login

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 4.2 Set secrets

From a machine that has the real values (never paste into Slack/git):

```bash
cd backend/sessions

fly secrets set \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  DATABASE_URL="postgresql://..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  ADMIN_API_KEY="same-as-admin-env" \
  RESEND_API_KEY="re_..." \
  DONNA_EMAIL="donnaadam@cleanupgiveback.org" \
  EMAIL_FROM="noreply@cleanupgiveback.org"
```

Optional: confirm with `fly secrets list` (names only, not values).

### 4.3 Deploy

After pulling latest code (includes `POST /feedback` + Donna email on finalize):

```bash
cd backend/sessions
fly deploy
```

Health check:

```bash
curl -s https://cleanup-sessions.fly.dev/health
```

Expect something like `{"status":"ok"}`.

---

## 5. Smoke tests for Dulf

| Test | How | Expect |
|------|-----|--------|
| Admin login | `BYPASS_AUTH=false`, open `/login`, Donna email/password | Dashboard loads |
| Non-admin blocked | Login with a user without `role: admin` | Access denied |
| Live sessions | Admin home with service role set | Real queue/KPIs (not only sample data) |
| Approve email | Approve a session while Resend is set | Volunteer gets email (if they have an Auth email) |
| Donna alert | Finalize a session from the mobile app (API URL → Fly) | Donna gets “ready for review” email |
| Feedback | Submit feedback in the app | Row appears on admin `/feedback` |
| Letterhead | Approved session → Generate letterhead | PDF downloads; needs matching `ADMIN_API_KEY` |

If email is skipped, check Fly logs: `fly logs -a cleanup-sessions` for `RESEND` / `DONNA_EMAIL` warnings.

---

## 6. Who owns which secret

| Secret | Supabase | Resend | Admin `.env.local` | Fly |
|--------|:--------:|:------:|:------------------:|:---:|
| Project URL / anon key | source | | yes | URL yes |
| service_role | source | | yes | yes |
| `DATABASE_URL` | source | | | yes |
| `RESEND_API_KEY` | | source | yes | yes |
| `DONNA_EMAIL` / `EMAIL_FROM` | | domain | yes | yes |
| `ADMIN_API_KEY` | | | yes (match) | yes (match) |

---

## 7. Need help?

- Supabase schema / Storage: [supabase.md](../supabase.md)  
- Admin product behavior: [admin-portal-prd.md](admin-portal-prd.md)  
- Sample login file: repo root `credentials.local.md` (gitignored)  

When in doubt: **never** put `service_role` or Resend keys in the Expo/`EXPO_PUBLIC_*` env.
