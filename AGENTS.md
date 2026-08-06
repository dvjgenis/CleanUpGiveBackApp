@docs/agents/AGENTS.md

## Learned User Preferences

- In `admin-web-app`, prefer `react-icons` over Lucide when adding new icons.
- Keep post-task wrap-ups short; ask clarifying questions during the task, not only at the end.
- Prefer Expo LAN over tunnel for local mobile runs.
- When adding shop product photos, do not delete existing PNGs — add new assets alongside and wire them into the correct views.
- Admin UI and copy are written for operator Donna Adams (account chrome, welcome text, “Donna can…” flows).
- Prefer real icon arrows over text-arrow affordances across the admin website.
- Tote bag color variants should use earth/ocean labels in data/backend (not green/blue UI labels).
- Admin sessions/users must stay on real Supabase data (no fixture fallback); service-role reads must be cookie-free so signed-in admin JWTs do not empty RLS-scoped lists.
- On admin session walking-path maps, use square rounded photo thumbnails that open a lightbox (not circular pins).
- On admin home, Payments and Orders cards should stay clickable without chevron affordances.
- Live session walk maps must not draw a path until real GPS movement points exist (no synthetic straight line when stationary).
- Prefer the mobile-app style password-field icon on the admin web login.

## Learned Workspace Facts

- Production admin console lives in `admin-web-app/` (renamed from `web-app`); legacy `admin/` is archived — keep `admin/db/*.sql` for Supabase migrations only.
- Admin event address autocomplete uses Photon first, with Google Maps Places as fallback when a key is available.
- Transactional email for admin/mobile flows uses Resend (`RESEND_API_KEY` in env; never commit secrets).
- Volunteer profile “Miles Walked” sums `sessions.distance_miles` for approved sessions only (same scope as Approved Hours).
- `admin-web-app` deploys on Vercel; live session services run from `backend/sessions/` on Fly.
- Admin-web-app stack is Next.js App Router + TypeScript + Tailwind + shadcn-style `components/ui`.
- Mobile shop product carousels follow the trash-cleanup-kit pattern under the figma shop screens/assets.
- Admin top period bar is Today / Month / Year / All / Custom (no 30-day option). Payments: Month = last 6 months, Year = last 6 years; Sessions/Orders/Feedback Month uses a rolling ~30-day window.
- Mobile session checkpoint photos should persist lat/long so admin walking-path maps can pin them by capture location.
- Shipping research for Donna: Phase 1 Pirate Ship labels + paste tracking in existing Orders UI + Resend email; Phase 2 Shippo at higher volume (see `docs/research/shipping-integration-2026-08.md`).
- Mobile shop catalog/cart remain largely client-side; Stripe checkout and live shipping are not fully backend-wired yet.
