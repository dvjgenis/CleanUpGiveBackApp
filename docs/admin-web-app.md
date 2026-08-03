# Clean Up - Give Back Web Application

## Overview

The web application provides a desktop-friendly admin interface for managing Clean Up - Give Back operations, complementing the existing React Native mobile app.

## Project Structure

```
CleanUpGiveBackApp/
├── frontend/          # React Native mobile app
├── admin/             # ARCHIVED legacy admin — keep admin/db/*.sql migrations
├── backend/           # Backend services
└── admin-web-app/           # Production Next.js admin console (Vercel)
    ├── src/
    │   ├── app/       # Next.js App Router pages
    │   ├── components/ # Reusable UI components
    │   └── lib/       # Utility functions
    └── package.json
```

## Features

### Animated Sidebar Navigation
- **Desktop (≥1024px / `lg`)**: Auto-expand on hover (72px ↔ 240px)
- **Tablet & mobile (<1024px)**: Top bar + full-screen overlay drawer (matches admin MobileNav breakpoint)
- **Responsive**: Tables stay card-stacked until `lg`; KPI/chart grids use 1→2→3 columns across phone/tablet/desktop
- **Accessible**: Keyboard navigation support; Escape closes the mobile drawer

### Navigation Sections (sidebar order)
- **Home** (`/`): Overview metrics and recent activity
- **Sessions** (`/sessions`): Session review and management; header **Export** accordion (CSV download + PDF via print dialog)
- **Users** (`/users`): Volunteer / user directory; **Export** accordion
- **Insights** (`/insights`): Data visualization and reports (no Enhanced Geocoding toggle; standard US heatmap only); header **Export** accordion (CSV + PDF)
- **Feedback** (`/feedback`): Volunteer feedback; **Export** accordion
- **Events** (`/events`): Event management and scheduling; **Export** accordion (+ New Event)
- **Orders** (`/orders`): Shop order processing and fulfillment; **Export** accordion
- **Payment** (`/payments`): Payment tracking; **Export** accordion
- **Donna Adams / Settings**: Footer links (`/profile`, `/settings`); `/profile` Account page lets Donna edit name, email, and password (mock local save; admin persists via Supabase) with show/hide eye toggles (`react-icons/io5` `IoEye` / `IoEyeOff`) on all three password fields; account row shows name + initials; brand mark uses `/logo.png` (not a CG placeholder)

### Technical Features
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Utility-first styling — custom `--spacing-*` tokens must be paired with explicit `--max-width-*` so `max-w-2xl` etc. do not collapse to spacing values (e.g. 40px)
- **Framer Motion**: Smooth animations
- **Dark Mode**: Automatic theme switching
- **SEO Ready**: Next.js App Router benefits

## Getting Started

1. **Navigate to web app directory**:
   ```bash
   cd admin-web-app
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## Development

### Current Status
- ✅ Sidebar navigation implemented
- ✅ Responsive design working
- ✅ Basic page structure created
- ✅ Animation system integrated
- ✅ Dark mode support
- ✅ **Live-wired to the shared Supabase project** (same one `admin/` and `frontend/` use) — see [Live data wiring](#live-data-wiring) below
- ✅ Home dashboard (`/dashboard`) uses the real interactive `UsHeatmap` (nation → state → county → neighborhood drill-down), ported verbatim from `admin/`
- ✅ Insights (`/insights`, also `/analytics`) matches admin Insights layout: trend, queue age, decisions, court progress (View more when >5), donuts, US heatmap — trend/queue/decisions/donuts/heatmap/court-progress now driven by live `sessions` + `court_orders`, falling back to fixtures per table
- ✅ `/sessions` supports Approve/Decline moderation on `under_review` rows (writes to `sessions` + `admin_audit_log`, emails/pushes the volunteer via `notifyVolunteerSessionDecision`); mock mode does a local-only optimistic update
- ✅ `/sessions` also supports **bulk approve** (row checkboxes + "Approve selected"), and the session preview drawer (`SessionPreviewDrawer.tsx`) adds **Hours Adjustment**, **Admin Notes**, and **Letterhead PDF generation** — all wired to the same admin server actions/API routes, mock-mode-safe. **Walking Path** and **Photos** hydrate from live Supabase when available: MapLibre polyline from `sessions.route` + signed `session-photos` checkpoint thumbs (via `loadSessionEvidence`)
- ✅ `/events/[id]` supports Edit / Publish-Unpublish / Delete and **Notify at-risk volunteers** (emails court-ordered volunteers behind on hours about the event via Resend), matching admin's event detail actions

### Live data wiring
admin-web-app reads/writes the same Supabase project as `admin/` and the mobile app (`frontend/`), via a `admin-web-app/src/lib/supabase/{server,client}.ts` pair ported from `admin/lib/supabase/`. Copy `admin-web-app/.env.local.example` → `admin-web-app/.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (same project as `admin/.env.local`) to go live; without it, every page below falls back to fixtures automatically and shows a **Sample data** banner (`components/ui/SampleDataBanner.tsx`).

Each `app/*/page.tsx` route is now an async Server Component that calls a loader in `admin-web-app/src/lib/live-data.ts`, then passes the result as props into the (still `"use client"`) page component — same "prefer live, fall back to mock when the table is empty" pattern as `admin/lib/dashboard-data.ts` / `admin/lib/payments-data.ts`:

| Page | Live source | Loader |
|------|-------------|--------|
| `/`, `/dashboard` | `sessions`, `shop_orders`, `volunteer_feedback` tables | `loadLiveSessions`, `loadLiveOrders`, `loadLiveMonthlyRevenue`, `loadLiveFeedback` |
| `/sessions` | `sessions` table + Auth directory | `loadLiveSessions` |
| `/feedback` | `volunteer_feedback` table + Auth directory + `sessions` | `loadLiveFeedback` |
| `/orders` | `shop_orders` table + Auth directory | `loadLiveOrders` |
| `/payments` | `shop_orders` + `donations` tables (per-source live/mock fallback — no writer for `donations` yet, matching `admin/lib/payments-data.ts`) | `loadLiveMonthlyRevenue`, `loadLiveShopItemBreakdown` |
| `/users`, `/volunteers` | Auth Admin API (`listUsers`) + `sessions` + `court_orders` | `loadLiveUsers` |
| `/volunteers/[id]` | Auth Admin (`getUserById`) + `sessions` (incl. `distance_miles`) + `court_orders` — KPI strip shows Sessions, Approved Hours, **Miles Walked** (sum of `distance_miles` on approved sessions), and Court Progress when applicable | `loadLiveVolunteerById` |
| `/events`, `/events/[id]` | `events` table — same rows the mobile app reads for its Upcoming Events feed | `loadLiveEvents`, `loadLiveEvent` |
| `/events/new`, `/events/[id]/edit` | Writes to `events` table + `event-photos` storage bucket via the `createEvent`/`updateEvent` server actions (`admin-web-app/src/actions/events.ts`, ported from `admin/actions/events.ts`) | — |
| `/events/[id]` actions | Publish/unpublish/delete write to `events`; **notify at-risk volunteers** reads `court_orders` + `sessions` + Auth directory via `buildCourtRisk`, emails through Resend, and records `event_volunteer_notices` | `setEventPublished`, `deleteEvent`, `notifyAtRiskVolunteers` (`admin-web-app/src/actions/events.ts`) |
| `/sessions` moderation | Approve/decline write to `sessions` + `admin_audit_log`, then email/push the volunteer | `approveSession`, `declineSession` (`admin-web-app/src/actions/sessions.ts`) |
| `/sessions` bulk approve + drawer actions | Bulk-approve (`SessionsPage.tsx` checkboxes) writes each `sessions` row + `admin_audit_log`, same notify path as single approve. Hours/Notes/Letterhead (`SessionPreviewDrawer.tsx`) write `adjusted_hours`/`admin_notes`/`letterhead_generated_at` + `admin_audit_log`. Drawer Walking Path / Photos load `sessions.route` + signed checkpoint URLs when present | `approveSessionsBulk`, `adjustHours`, `saveAdminNotes`, `markLetterheadGenerated`, `loadSessionEvidence` (`admin-web-app/src/actions/sessions.ts`) |
| `/insights`, `/analytics` | `sessions` table (trend/queue/decisions/donuts/heatmap) + `court_orders` (court progress) | `loadLiveSessions`, `loadLiveCourtProgress` |

Volunteer name/email resolution (`admin-web-app/src/lib/volunteers.ts`), event timing/date helpers (`admin-web-app/src/lib/events.ts`), and court-ordered at-risk math (`admin-web-app/src/lib/court-risk.ts`, `buildCourtRisk`) are direct ports of `admin/lib/volunteers.ts` / `admin/lib/events.ts` / `admin/lib/court-risk.ts`. Audit logging (`admin-web-app/src/lib/audit.ts` → `admin_audit_log`) and volunteer notifications (`admin-web-app/src/lib/notify.ts` + `admin-web-app/src/lib/resend.ts`, soft-failing when `RESEND_API_KEY` is unset) are ports of `admin/lib/audit.ts` / `admin/lib/notify.ts` / `admin/lib/resend.ts`. **Resend (2026-08-03):** domain `cleanupgiveback.org` verified; set `RESEND_API_KEY` / `EMAIL_FROM` / `DONNA_EMAIL` in `.env.local` for local sends (see `.env.local.example`). Production Vercel still needs those vars for hosted admin email. Letterhead PDF generation proxies to the same `backend/sessions` service admin uses, via `admin-web-app/src/app/api/service-letter/[sessionId]/route.ts` and `.../bulk/[volunteerId]/route.ts` (ported from `admin/app/api/service-letter/`), configured with `SESSIONS_API_URL`/`ADMIN_API_KEY` (`admin-web-app/src/lib/sessionsApiConfig.ts`, `assertAdmin.ts`).

**Donations revenue** now reads the shared `public.donations` table (`admin/db/006_donations.sql`), falling back to fixtures when it's empty — same per-source fallback as shop revenue. There's no writer for `donations` yet (the mobile Donate flow, `frontend/src/app/donate.tsx`, is still local/mock pending Stripe or another processor), so in practice this stays on fixtures until rows are seeded or a real checkout ships; it's not tracked as a follow-up anymore since the live-read path is in place.

### Mock Page Ports
Several pages started as faithful, read-only ports of their `admin/app/(admin)/...` counterparts, backed by fixtures in `admin-web-app/src/lib/mock-data.ts`; most now prefer live Supabase data per the table above, falling back to the same fixtures when a table is empty:
- **`/orders`** (`components/pages/OrdersPage.tsx`) — ports `admin/app/(admin)/orders` + `OrdersClientShell.tsx`; accepts a live `orders` prop, defaults to `MOCK_ORDERS`.
- **`/feedback`** (`components/pages/FeedbackPage.tsx`) — ports `admin/app/(admin)/feedback`; accepts a live `feedback` prop, defaults to `MOCK_FEEDBACK` + `EMOJI_MAP`. Client-side **rating filter** chips (All / Excited → Very Sad, same pill pattern as Orders/Users); rating-distribution columns are also toggleable filters. KPIs + distribution stay on the full set; the list and count update to the selected rating.
- **`/sessions`** (`components/pages/SessionsPage.tsx`) — ports `admin/app/(admin)/sessions` + `SessionsClientShell.tsx`; accepts a live `sessions` prop, defaults to `MOCK_SESSIONS`. Search, status filter (including **Active** for in-progress tracking rows), and court-ordered filter are client-side. Status chips use `getSessionStatusConfig` (same set as admin: `active` / `under_review` / `approved` / `not_approved` / `invalid`) so live `active` rows don't crash SSR. Volunteer names link to `/volunteers/[user_id]` with `hover:text-primary hover:underline` (desktop + mobile list; click does not open the session drawer). `under_review` rows show inline **Approve**/**Decline** actions (decline opens a small reason modal, simplified vs. admin's floating actions menu — no toast system in admin-web-app, so feedback is an inline status line) wired to `approveSession`/`declineSession`; in mock mode these update local state only ("demo — not saved"). `under_review` rows also expose a checkbox for **bulk approve** (`approveSessionsBulk`) via an action bar that appears once one or more rows are selected.
- **Session preview drawer** (`components/ui/SessionPreviewDrawer.tsx`) — Session Info, **Walking Path** (live MapLibre polyline from `sessions.route` when ≥2 points, with mobile-style **Play / Pause / Replay**, labeled **Start** / **End**, **fullscreen** map mode, and **checkpoint photo thumbnails** placed along the trail by capture time; otherwise an honest empty/loading state), **Photos** (signed `session-photos` checkpoint grid + lightbox via `SessionPhotoGrid`), live Approve/Decline, **Hours Adjustment** / **Admin Notes** (`adjustHours`/`saveAdminNotes`), and **Letterhead PDF** (`/api/service-letter/[id]`). Evidence loads on open through `loadSessionEvidence` (`lib/session-evidence.ts`); mock mode keeps dashed placeholders.
- **`/payments`** (`components/pages/PaymentsPage.tsx`) — ports `admin/app/(admin)/payments` + `PaymentsBreakdownSection.tsx`; accepts live `monthly`/`itemBreakdown` props (shop revenue from `shop_orders`, donations from the new `donations` table — each falls back to fixtures independently when its table is empty), with a ported `components/ui/RevenueBarChart.tsx`. Includes **Shop items** breakdown (`ShopItemBreakdownSection`) for kit / tote / grabber / adult & child vest (units, revenue, share, most/least). The admin version's period datepicker is still dropped in favor of the Home/Sessions/Orders `PeriodToggle`.
- **`/dashboard` US map** (`components/dashboard/UsHeatmap.tsx`) — verbatim port of `admin/components/dashboard/UsHeatmap.tsx`, plus its supporting `admin/lib/us-geo.ts` and `admin/lib/us-heatmap.ts` (copied unmodified to `admin-web-app/src/lib/`). Loads live TopoJSON (`us-atlas` via CDN) with `d3-geo`/`topojson-client` for the same nation/state/county/neighborhood drill-down as admin. Fed by `buildGeoActivity(sessions)` in `mock-data.ts`, now parameterized to accept live sessions; county/neighborhood tiers stay empty until session GPS → FIPS geocoding ships (same placeholder admin uses).
- **`/events/new`, `/events/[id]/edit`** (`components/pages/NewEventPage.tsx` + `components/events/*`) — port of `admin/app/(admin)/events/new/page.tsx` + `.../[id]/edit/page.tsx` and `EventForm` / `AddressAutocomplete` / `EventPhotoUpload`. Linked from Events → **+ New Event** and from an event detail page's **Edit event** action. `EventForm` submits to the real `createEvent`/`updateEvent` server actions (`admin-web-app/src/actions/events.ts`) via `useActionState`, writing to Supabase and uploading photos to the `event-photos` bucket. Address field: **US Census verify-on-blur** by default (`verifyEventAddress` → `forwardGeocodeAddress`); when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, switches to **Google Places Autocomplete**. On save, if `lat`/`lng` are still missing, `geocodeAddress` runs Census first, then **Google Geocoding** if a Maps key is configured (`GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). The edit route redirects back to the read-only detail view if `id` doesn't resolve to a real row (mock fixtures aren't editable).
- **`/events/[id]`** (`components/pages/EventDetailPage.tsx` + `components/events/EventDetailActions.tsx` + `components/events/NotifyAtRiskVolunteers.tsx` + `components/events/EventLocationMap.tsx`) — ports `admin/app/(admin)/events/[id]/page.tsx` + `EventDetailActions.tsx` + `NotifyAtRiskVolunteers.tsx`. For a live event, renders Edit/Publish-Unpublish/Delete buttons and an at-risk-volunteer email picker (candidates computed server-side via `buildCourtRisk`); mock fixtures show the original read-only actions panel only. When `lat`/`lng` are present (live rows or the sample fixture), shows a **Location map** via `EventLocationMap` — in-page MapLibre GL JS (`maplibre-gl`) + Carto Voyager *raster* tiles with brand pin (mobile Expo Go WebView uses the same raster style); tap opens Google Maps. Raster avoids blank cream maps when vector tile hosts are blocked. Photo carousel at the top of detail (and list-card thumbnail) use `image_urls` / sample Unsplash placeholders.
- **Events sample fixture** — when Supabase `events` is empty, `EventsPage` falls back to a **single** mock event (`Downtown Riverfront Clean-up`, Des Plaines `42.0417,-87.887`) aligned with mobile `downtownRiverfrontEvent`, including Unsplash photo placeholders and coords for the location map.
- **Period toggle** (`components/ui/PeriodToggle.tsx`) — port of `admin/components/ui/PeriodToggle.tsx` (Today / Month / 30 days / Year / All / Custom + From–To datepicker). Wired on Home (`/`), Insights (`/insights` + `/analytics`), Sessions (`/sessions`), Payments (`/payments`), and Orders (`/orders`) via URL `period`/`from`/`to` params, matching admin.
- **`/insights`, `/analytics`** (`components/pages/AnalyticsPage.tsx`) — port of `admin/app/(admin)/insights/page.tsx` using `TrendAreaChart`, `HorizontalBarChart`, `CourtProgressChart`, `DonutChart`, and `UsHeatmap`. Accepts live `sessions`/`courtProgress` props (`loadLiveSessions`, `loadLiveCourtProgress`), defaulting to `MOCK_SESSIONS`/`MOCK_COURT_PROGRESS`; shows `SampleDataBanner` when either falls back. Court progress still shows a **View more** button when the list exceeds 5 (expands in place; View less collapses). Chart series aren't yet re-scoped by the period range.

### Next Steps
1. **Backend Integration**:
   - ✅ Connect to existing Supabase database (see [Live data wiring](#live-data-wiring))
   - Implement real authentication flow (currently `BYPASS_AUTH` for local dev, matching admin)
   - Share user sessions with admin panel (single sign-on across `admin.cleanupgiveback.org` and web-app once both are deployed)
   - ✅ `/sessions` moderation actions (approve/decline), `/events` edit/publish/delete/notify, and `/insights` + `/analytics` chart series are now live-wired

2. **Content Development**:
   - Volunteer profile detail pages
   - Order fulfillment workflow (tracking/carrier updates, currently read-only)
   - ✅ Bulk session approve, admin notes, hours adjustment, and letterhead PDF generation — now wired (`/sessions` list checkboxes + `SessionPreviewDrawer.tsx`)

3. **API Integration**:
   - ✅ Reused admin's audit logging and Resend notification patterns (`admin-web-app/src/lib/audit.ts`, `resend.ts`, `notify.ts`)
   - Add loading states and error handling around the live-data loaders

4. **Enhanced UI**:
   - Form components
   - Data tables
   - Modal dialogs
   - Toast notifications

## Integration with Existing Systems

### Shared Resources
- **Database**: Same Supabase instance as mobile app and admin — live-wired (see above)
- **Authentication**: Can share auth with admin panel (same `user_metadata.role === 'admin'` convention; `BYPASS_AUTH` supported for local dev)
- **Assets**: Reuse logos, images, branding
- **API Endpoints**: Leverage existing backend services

### Deployment
- **Live on Vercel**: Project `cleanupgiveback-web-app` → https://cleanupgiveback-web-app.vercel.app (`cd admin-web-app && vercel --prod`). Deployed 2026-07-30, replacing the retired `cleanupgiveback-admin` Vercel project. Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BYPASS_AUTH`) are set for Production and Development on Vercel; Preview env vars still need to be added manually in the Vercel dashboard (CLI non-interactive add hit a `git_branch_required` prompt for the Preview target).
- **Netlify**: Alternative static hosting (not used)
- **Subdomain**: consider `app.cleanupgiveback.org` once DNS is ready

## Architecture Benefits

### Separation of Concerns
- **Mobile App** (`frontend/`): Native user experience
- **Web App** (`admin-web-app/`): Production admin console (Vercel)
- **Archived admin** (`admin/`): Legacy Next portal — migrations in `admin/db/` only; see [admin/README.md](../admin/README.md)
- **Backend** (`backend/`): Shared services

### Progressive Enhancement
- Admin product work continues in `admin-web-app/`
- Legacy `admin/` is frozen reference + SQL migrations
- Independent deployment cycles for mobile / admin-web-app / Fly

### Technology Alignment
- **React**: Shared component patterns
- **TypeScript**: Consistent type safety
- **Tailwind**: Unified styling approach
- **Modern Tooling**: Better developer experience

## Component Architecture

### Sidebar System
```typescript
// Context-based state management
const { open, setOpen, animate } = useSidebar();

// Responsive components
<SidebarBody>          // Wrapper for desktop + mobile
  <DesktopSidebar />   // Auto-expanding desktop version
  <MobileSidebar />    // Full-screen mobile overlay
</SidebarBody>

// Navigation links
<SidebarLink link={{
  label: "Dashboard",
  href: "/dashboard", 
  icon: <LayoutDashboard />
}} />
```

### Animation Features
- **Framer Motion**: Smooth width transitions
- **Hover States**: Interactive feedback
- **Mobile Gestures**: Touch-friendly interactions
- **Performance**: GPU-accelerated animations

## Customization Guide

### Branding
- Logo: Update `Logo` and `LogoIcon` components
- Colors: Modify Tailwind classes (currently using green theme)
- Typography: Adjust font families in `globals.css`

### Navigation
- Links: Edit the `links` array in `sidebar-demo.tsx`
- Icons: Use Lucide React or custom SVGs
- Routes: Add new pages in `src/app/`

### Styling
- Theme: Modify CSS variables in `globals.css`
- Components: Update Tailwind classes
- Responsive: Adjust breakpoints as needed

## Performance Considerations

### Optimizations
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Font Loading**: Optimized web fonts
- **Bundle Size**: Tree shaking and compression

### Monitoring
- **Core Web Vitals**: Next.js built-in metrics
- **Analytics**: Google Analytics or similar
- **Error Tracking**: Sentry or similar service
- **Performance**: Lighthouse audits

## Security

### Best Practices
- **Authentication**: Secure token handling
- **Authorization**: Role-based access control
- **Input Validation**: Client and server-side
- **XSS Protection**: Next.js built-in security

### Integration Security
- **CORS**: Configure for backend APIs
- **CSP**: Content Security Policy headers
- **HTTPS**: Enforce secure connections
- **Environment Variables**: Secure config management