# Documentation index

Living docs for the Clean Up - Give Back monorepo. Templates are copy-only.

## Start here

| Doc | Purpose |
|-----|---------|
| [current.md](current.md) | What runs today |
| [architecture.md](architecture.md) | System Mermaid diagrams (frontend, backend, integrations) |
| [progress.md](progress.md) | Session-by-session progress log |
| [implementation-plan.md](implementation-plan.md) | Planned work and milestones |
| [accounts-and-access.md](accounts-and-access.md) | Org accounts (no secrets in repo) |
| [supabase.md](supabase.md) | Supabase + Fly setup for sessions (schema, env vars) |
| [reports/](reports/) | Session / decision reports (e.g. dual-cam App Store stance) |
| [research/shipping-integration-2026-08.md](research/shipping-integration-2026-08.md) | Shipping/tracking research brief for Donna (Phase 1 Pirate Ship + Resend → Phase 2 Shippo) |
| [admin-web-app.md](admin-web-app.md) | Production admin console (`admin-web-app/` on Vercel) |
| [admin/admin-portal-prd-v3.md](admin/admin-portal-prd-v3.md) | **Current** admin web app PRD (shipped + near-term roadmap) |
| [admin/admin-portal-prd.md](admin/admin-portal-prd.md) | Historical v2 PRD (pre–`admin-web-app`; app `admin/` archived) |
| [admin/brand-web.md](admin/brand-web.md) | Web brand guidelines for admin portal (CSS tokens, fonts, Tailwind config) |
| [admin/a11y-audit-2026-07-22.md](admin/a11y-audit-2026-07-22.md) | Admin portal axe WCAG 2.1 AA audit + remediation |
| [admin/ux-audit-2026-07-22.md](admin/ux-audit-2026-07-22.md) | Donna-persona dashboard UX audit + remediation |
| [admin/chart-types-2026-07-22.md](admin/chart-types-2026-07-22.md) | Useful chart types for Today (behind Show charts) |
| [admin/admin-feature-batch-2026-07-28.md](admin/admin-feature-batch-2026-07-28.md) | Search, PDF fix, notify-at-risk email, payments breakdown, Users merge, multi event photos/address upload, dashboard commerce cards |
| [admin/mobile-responsiveness-audit-2026-07-28.md](admin/mobile-responsiveness-audit-2026-07-28.md) | Mobile viewport audit (375/768/1024) + P0/P1 fixes |
| [admin/refinement-contracts-2026-07-28.md](admin/refinement-contracts-2026-07-28.md) | Contracts for notify, feedback, court upsert, decline_reason, RLS claim path |
| [admin/dulf-resend-supabase-fly.md](admin/dulf-resend-supabase-fly.md) | Runbook for Dulf — Resend, Supabase, Fly secrets + Donna admin user |
| [admin/dulf-checkpoint-gps-fly-redeploy.md](admin/dulf-checkpoint-gps-fly-redeploy.md) | Dulf — redeploy Fly after checkpoint lat/lng migration (trail photo pins) |

## Frontend

| Path | Purpose |
|------|---------|
| [frontend/brand.md](frontend/brand.md) | Colors, fonts, copy tone (Figma token reference) |
| [frontend/screen-map.md](frontend/screen-map.md) | PRD → Figma → code screen inventory |
| [frontend/context/](frontend/context/) | Scoped living context (app, components, assets, …) |
| [frontend/specs/figma-to-native-handoff.md](frontend/specs/figma-to-native-handoff.md) | Figma-to-RN migration spec and acceptance criteria |
| [frontend/specs/](frontend/specs/) | All feature specs and PRDs |
| [frontend/specs/session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md) | Sessions + geolocation (Kalman, background-while-active, sync) |
| [frontend/specs/free-hour-tracker-paywall.md](frontend/specs/free-hour-tracker-paywall.md) | Free-hour countdown, paywall, Pay Later → session detail, Go Home |
| [frontend/specs/home-dashboard-session-stats.md](frontend/specs/home-dashboard-session-stats.md) | Home Service Hours + impact from `sessionStatsStore` |
| [frontend/specs/session-route-replay.md](frontend/specs/session-route-replay.md) | Play / Pause / Replay on completed route maps |
| [frontend/specs/service-letter-pdf.md](frontend/specs/service-letter-pdf.md) | Approved session service letter PDF (volunteer + admin) |
| [frontend/specs/event-calendar-export.md](frontend/specs/event-calendar-export.md) | Event detail → Apple / Google / device calendar |
| [frontend/specs/photo-checkpoint-dual-capture.md](frontend/specs/photo-checkpoint-dual-capture.md) | Checkpoint capture (`expo-camera` sequential) |
| [frontend/specs/expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md) | Expo Go Metro LAN / tunnel / cellular testing |
| [frontend/specs/expo-go-eas-tester-runbook.md](frontend/specs/expo-go-eas-tester-runbook.md) | Dual-runtime smoke checklist (Expo Go + EAS dev client) |
| [frontend/specs/map-theme-and-weather-icons.md](frontend/specs/map-theme-and-weather-icons.md) | Standard light/dark map theme + weather glyphs |
| [frontend/specs/live-session-lock-screen-widget.md](frontend/specs/live-session-lock-screen-widget.md) | **Proposed** — iOS Lock Screen/Dynamic Island Live Activity for active sessions |

## Figma design workspace

| Path | Purpose |
|------|---------|
| [`frontend/design/figma/`](../frontend/design/figma/README.md) | Ground-truth design workspace (manifest, pages, token exports) |
| [`frontend/design/figma/design.md`](../frontend/design/figma/design.md) | Complete Figma design system: color, type, spacing, elevation, components |
| [`frontend/design/figma/manifest.yaml`](../frontend/design/figma/manifest.yaml) | Screen inventory: Figma page → node → routeKey → migration status |
| [frontend/figma-token-fix-checklist-2026-07-10.md](frontend/figma-token-fix-checklist-2026-07-10.md) | Figma token/copy audit checklist (pages 2–7) |

## Compliance & privacy

| Path | Purpose |
|------|---------|
| [compliance/privacy-and-data-protection.md](compliance/privacy-and-data-protection.md) | Nationwide privacy framework (minors, CCPA, ISMS) |
| [compliance/mobile-app-privacy-policy-outline.md](compliance/mobile-app-privacy-policy-outline.md) | Privacy policy outline for counsel |
| [compliance/figma-compliance-screen-gap-audit.md](compliance/figma-compliance-screen-gap-audit.md) | Figma audit + new screen specs |
| [compliance/privacy-screen-split-decision.md](compliance/privacy-screen-split-decision.md) | account-privacy vs privacy-permissions vs policy viewers |
| [frontend/specs/privacy-compliance-prd-addendum.md](frontend/specs/privacy-compliance-prd-addendum.md) | PRD addendum reference (merged into main PRD) |
| [backend/specs/privacy-and-data-rights.md](backend/specs/privacy-and-data-rights.md) | Supabase deletion, export, retention |
| [adr/ADR-003-minor-data-protection-baseline.md](adr/ADR-003-minor-data-protection-baseline.md) | Strictest-baseline architecture decision |

## Backend

| Path | Purpose |
|------|---------|
| [backend/context/](backend/context/) | Domain context (maps, payments, sessions) |
| [backend/specs/](backend/specs/) | Backend feature specs |
| [backend/specs/sessions-api.md](backend/specs/sessions-api.md) | Sessions API contract (Fly + Supabase) |
| [backend/specs/order-emails.md](backend/specs/order-emails.md) | Order placed + shipped Resend emails (Figma `1311:359`) |
| [backend/specs/password-reset-email.md](backend/specs/password-reset-email.md) | Forgot Password Resend HTML (Figma `1311:449`; `/email/*` live on Vercel; send path not wired) |
| [backend/specs/hours-reminder-email.md](backend/specs/hours-reminder-email.md) | Court-ordered inactivity nudge email (Figma Nudge `1311:432`; live on Vercel) |

## Architecture & agents

| Path | Purpose |
|------|---------|
| [architecture.md](architecture.md) | Full-system Mermaid diagrams (clients, Fly, Supabase, integrations) |
| [adr/](adr/) | Architecture decision records |
| [agents/](agents/) | Agent instructions (`AGENTS.md`, `CLAUDE.md`) + [session-abuse-checklist.md](agents/session-abuse-checklist.md) (court / session gaming vectors) |

## Templates

- `frontend/context/TEMPLATE.md`, `backend/context/TEMPLATE.md`
- `frontend/specs/TEMPLATE.md`, `backend/specs/TEMPLATE.md`
- `adr/template.md`
