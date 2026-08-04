@docs/agents/AGENTS.md

## Learned User Preferences

- In `admin-web-app`, prefer `react-icons` over Lucide when adding new icons.
- Keep post-task wrap-ups short; ask clarifying questions during the task, not only at the end.
- Prefer Expo LAN over tunnel for local mobile runs.
- When adding shop product photos, do not delete existing PNGs — add new assets alongside and wire them into the correct views.
- Admin UI and copy are written for operator Donna Adams (account chrome, welcome text, “Donna can…” flows).
- Prefer real icon arrows over text-arrow affordances across the admin website.
- Tote bag color variants should use earth/ocean labels in data/backend (not green/blue UI labels).

## Learned Workspace Facts

- Production admin console lives in `admin-web-app/` (renamed from `web-app`); legacy `admin/` is archived — keep `admin/db/*.sql` for Supabase migrations only.
- Admin event address autocomplete uses Photon first, with Google Maps Places as fallback when a key is available.
- Transactional email for admin/mobile flows uses Resend (`RESEND_API_KEY` in env; never commit secrets).
- Volunteer profile “Miles Walked” sums `sessions.distance_miles` for approved sessions only (same scope as Approved Hours).
- `admin-web-app` deploys on Vercel; live session services run from `backend/sessions/` on Fly.
- Admin-web-app stack is Next.js App Router + TypeScript + Tailwind + shadcn-style `components/ui`.
- Mobile shop product carousels follow the trash-cleanup-kit pattern under the figma shop screens/assets.
