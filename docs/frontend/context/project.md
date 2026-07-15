# Context: project

Product-wide ontology and cross-cutting decisions.

## Ontology

| Term | Meaning |
|------|---------|
| Volunteer | Community service participant |
| Court-ordered participant | User completing mandated hours |
| Admin | Org staff reviewing submissions |
| Cleanup session | Tracked service period with location + photo evidence |
| Activity log | Record of hours and checkpoints |
| Evidence | Photos and GPS data supporting a session |
| Age-gate | Pre-auth month/year DOB screen before any PII collection |
| Parental consent | COPPA verifiable consent flow for users under 13 |
| Privacy tier | Account classification: `teen` (13–17) or `adult` (18+) with default settings |
| DPIA | Data Protection Impact Assessment for child-safety risks |

## Stack

- **Frontend:** Expo SDK 54, React Native 0.81, TypeScript, Expo Router (`frontend/`)
- **Backend:** Planned Node/services under `backend/` (maps, payments, sessions)
- **Docs:** `docs/` living documentation

## Decisions

- Monorepo layout — see [ADR-001](../adr/ADR-001-monorepo-layout.md)
- Path aliases: `@/*` → `frontend/src/*`, `@/assets/*` → `frontend/assets/*`
- Figma is the design ground truth; Stitch/HTML pipeline is frozen — see [ADR-002](../adr/ADR-002-figma-design-ground-truth.md)
- Nationwide minor data protection uses strictest-baseline strategy — see [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md)
- Privacy UI split: `account-privacy` hub, `privacy-permissions`, policy viewers — see [privacy-screen-split-decision.md](../../compliance/privacy-screen-split-decision.md)
- Session Tracking flow (PRD §6.9–6.15) built as an isolated feature slice at `frontend/src/features/session-tracking/` — not wired into `frontend/src/app/` Expo Router or `manifest.yaml`'s `implemented` status; a parallel exploratory build reviewed via its own `dev/PreviewApp.tsx` harness, separate from the Phase 1 migration path in [figma-to-native-handoff.md](../specs/figma-to-native-handoff.md)
- **Session duration:** wall-clock timestamps (`startedAt` → `endedAt`) are the canonical source for completed-session duration; `liveSessionStore` derives live elapsed time and checkpoint countdown from timestamps (not a fragile `+1s` counter). Backend finalize recomputes `durationSeconds` server-side.
- **GPS route capture:** route points append only when movement from the last stored point exceeds `max(6m, accuracy × 0.6)` and pass stationary/speed/turn filters; live map arrow uses EMA-smoothed `displayCoordinate`; optional Follow toggle (default off) pans the map on GPS updates.

## Related

- [brand.md](../brand.md) · [design.md](../design.md) · [screen-map.md](../screen-map.md)
