# Sessions API

Fastify + Prisma sessions service for Clean Up - Give Back.

**Spec:** [docs/backend/specs/sessions-api.md](../../docs/backend/specs/sessions-api.md)  
**Setup:** [docs/supabase.md](../../docs/supabase.md)

## Local development

```bash
cd backend/sessions
cp .env.example .env   # fill DATABASE_URL + SUPABASE_JWT_SECRET
npm install
npx prisma db push
npm run dev
```

## Deploy to Fly.io

```bash
export PATH="$HOME/.fly/bin:$PATH"
fly auth login

cd backend/sessions
fly launch --name cleanup-sessions --region ord --copy-config --yes   # first time only

fly secrets set \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  SUPABASE_JWT_SECRET="..." \
  DATABASE_URL="postgresql://postgres:...@db....supabase.co:5432/postgres"

fly deploy
```

After deploy, set `EXPO_PUBLIC_API_URL=https://cleanup-sessions.fly.dev` in `frontend/.env`.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/sessions` | Bearer JWT |
| POST | `/sessions/:id/checkpoints` | Bearer JWT |
| PATCH | `/sessions/:id/finalize` | Bearer JWT |
| GET | `/sessions` | Bearer JWT |
| GET | `/sessions/:id` | Bearer JWT |
| PATCH | `/sessions/:id/approval` | `X-Admin-Key` header |
