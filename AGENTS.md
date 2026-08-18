@docs/agents/AGENTS.md

## Learned User Preferences

- In `admin-web-app`, prefer `react-icons` over Lucide when adding new icons.
- Keep post-task wrap-ups short; ask clarifying questions during the task, not only at the end.
- Prefer Expo LAN over tunnel for local mobile runs.
- When adding shop product photos, do not delete existing PNGs — add new assets alongside and wire them into the correct views.
- Admin UI and copy are written for operator Donna Adams (account chrome, welcome text, “Donna can…” flows); email compose uses CC/BCC, font/size/color toolbar, schedule send, and everyday-language template chips (not `{{brackets}}`). Volunteer-facing emails use `info@cleanupgiveback.org` for assistance and must not mention Donna by name.
- Tote bag color variants should use earth/ocean labels in data/backend (not green/blue UI labels).
- Admin sessions/users must stay on real Supabase data (no fixture fallback); service-role reads must be cookie-free so signed-in admin JWTs do not empty RLS-scoped lists.
- On admin session walking-path maps, use square rounded photo thumbnails that open a lightbox (not circular pins).
- Live and replay maps must not draw a path until real GPS movement exists (no synthetic stationary line); when OS reports `speedMps === 0`, treat sub-gate jitter as stationary; replay also collapses when span < ~8 m or recorded distance < 0.01 mi — prefer tightening append gates over lowering the collapse span much under ~5–6 m.
- Admin session empty photo state should show four placeholders (Selfie → Progress → Selfie → Progress), not three; pre-session photo cancel → Home, mid-session cancel → live tracker.
- Court In Progress card should support search, clickable volunteer names, and a fullscreen expand view for Donna.
- Home **Your Impact** favors a visual Recent Cleanups feed with a concise period summary (not a dense stats grid); month/year pickers are list-only with no type-to-search.

## Learned Workspace Facts

- Production admin console lives in `admin-web-app/` (renamed from `web-app`); legacy `admin/` is archived — keep `admin/db/*.sql` for Supabase migrations only.
- Admin place search: event address autocomplete uses Photon first with Google Places when a key is available; US heatmap/fullscreen map search uses Census (streets) + Photon (places) in parallel with Nominatim as backup (Google Places optional).
- Transactional email for admin/mobile flows uses Resend (`RESEND_API_KEY` in env; never commit secrets). Volunteer templates: CTA buttons primary green with a stroke (not lime); current-hours in white; icons/logos/GIFs must load consistently; sender avatar is the filled CUPGB mark (white on primary green).
- Volunteer profile “Miles Walked” sums `sessions.distance_miles` for approved sessions only (same scope as Approved Hours).
- `admin-web-app` deploys on Vercel (Next.js App Router + TypeScript + Tailwind + shadcn-style `components/ui`); live session services run from `backend/sessions/` on Fly.
- Admin top period bar is Today / Month / Year / All / Custom (no 30-day option). Payments: Month = last 6 months, Year = last 6 years; Sessions/Orders/Feedback Month uses a rolling ~30-day window.
- Mobile session checkpoint photos should persist lat/long so admin walking-path maps can pin them by capture location.
- Shipping for Donna: Phase 1 Pirate Ship labels + paste tracking in Orders UI + Resend email; Phase 2 Shippo at higher volume (see `docs/research/shipping-integration-2026-08.md`). Checkout offers pickup/local vs shipped; app charges for access, not kit cost. Free cleanup kit confirmation emails should show free shipping and a $59.99 total.
- Mobile shop catalog/cart remain largely client-side; Stripe checkout and live shipping are not fully backend-wired yet.
- Onboarding service type (Court Ordered / Volunteering / School / Other) syncs to Auth `user_metadata.service_type` and shows in admin Sessions; it is distinct from per-session `sessions.court_ordered` and `court_orders` rows.
- Mobile session detail shows Donna's volunteer-facing `sessions.decline_reason` when Declined (`admin_notes` admin-only). Free-hour **Pay Later** finalizes as `under_review`, opens that session's detail, and **Go Home** / back chevron return Home (not live tracker).
- Mobile list/detail fetch and session finalize flows use `BrandLoadingView` (JS physics broom sweep + Sanchez label), not bare `ActivityIndicator`; preserve emoji broom SVG fills, not brand-green remapping.
