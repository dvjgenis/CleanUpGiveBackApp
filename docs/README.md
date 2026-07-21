# Documentation index

Living docs for the Clean Up - Give Back monorepo. Templates are copy-only.

## Start here

| Doc | Purpose |
|-----|---------|
| [current.md](current.md) | What runs today |
| [progress.md](progress.md) | Session-by-session progress log |
| [implementation-plan.md](implementation-plan.md) | Planned work and milestones |
| [accounts-and-access.md](accounts-and-access.md) | Org accounts (no secrets in repo) |
| [supabase.md](supabase.md) | Supabase + Fly setup for sessions (schema, env vars) |
| [reports/](reports/) | Session / decision reports (e.g. dual-cam App Store stance) |

## Frontend

| Path | Purpose |
|------|---------|
| [frontend/brand.md](frontend/brand.md) | Colors, fonts, copy tone (Figma token reference) |
| [frontend/screen-map.md](frontend/screen-map.md) | PRD → Figma → code screen inventory |
| [frontend/context/](frontend/context/) | Scoped living context (app, components, assets, …) |
| [frontend/specs/figma-to-native-handoff.md](frontend/specs/figma-to-native-handoff.md) | Figma-to-RN migration spec and acceptance criteria |
| [frontend/specs/](frontend/specs/) | All feature specs and PRDs |
| [frontend/specs/session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md) | Sessions + geolocation (Kalman, background-while-active, sync) |
| [frontend/specs/home-dashboard-session-stats.md](frontend/specs/home-dashboard-session-stats.md) | Home Service Hours + impact from `sessionStatsStore` |
| [frontend/specs/session-route-replay.md](frontend/specs/session-route-replay.md) | Play / Pause / Replay on completed route maps |
| [frontend/specs/event-calendar-export.md](frontend/specs/event-calendar-export.md) | Event detail → Apple / Google / device calendar |
| [frontend/specs/photo-checkpoint-dual-capture.md](frontend/specs/photo-checkpoint-dual-capture.md) | Checkpoint capture (`expo-camera` sequential) |
| [frontend/specs/expo-go-dev-networking.md](frontend/specs/expo-go-dev-networking.md) | Expo Go Metro LAN / tunnel / cellular testing |
| [frontend/specs/map-theme-and-weather-icons.md](frontend/specs/map-theme-and-weather-icons.md) | Standard light/dark map theme + weather glyphs |

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

## Architecture & agents

| Path | Purpose |
|------|---------|
| [adr/](adr/) | Architecture decision records |
| [agents/](agents/) | Agent instructions (`AGENTS.md`, `CLAUDE.md`) |

## Templates

- `frontend/context/TEMPLATE.md`, `backend/context/TEMPLATE.md`
- `frontend/specs/TEMPLATE.md`, `backend/specs/TEMPLATE.md`
- `adr/template.md`
