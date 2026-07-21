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
- **Backend:** `backend/sessions/` Fastify + Prisma on Fly (`cleanup-sessions.fly.dev`); payments/maps services still planned
- **Docs:** `docs/` living documentation

## Decisions

- Monorepo layout — see [ADR-001](../adr/ADR-001-monorepo-layout.md)
- Path aliases: `@/*` → `frontend/src/*`, `@/assets/*` → `frontend/assets/*`
- Figma is the design ground truth; Stitch/HTML pipeline is frozen — see [ADR-002](../adr/ADR-002-figma-design-ground-truth.md)
- Nationwide minor data protection uses strictest-baseline strategy — see [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md)
- Privacy UI split: `account-privacy` hub, `privacy-permissions`, policy viewers — see [privacy-screen-split-decision.md](../../compliance/privacy-screen-split-decision.md)
- Session Tracking **production** flow (PRD §6.9–6.15) ships via `frontend/src/app/` + `liveSessionStore` (Fly API, GPS, `expo-camera`, WebView/native maps). The same folder keeps a **legacy mock PreviewApp** harness for isolated UI review — see [session-tracking README](../../../frontend/src/features/session-tracking/README.md) and [figma-to-native-handoff.md](../specs/figma-to-native-handoff.md).
- **Session duration:** wall-clock timestamps (`startedAt` → `endedAt`) are the canonical source for completed-session duration; `liveSessionStore` derives live elapsed time and checkpoint countdown from timestamps (not a fragile `+1s` counter). Backend finalize recomputes `durationSeconds` server-side.
- **GPS route capture:** samples pass a 2D Kalman filter, then append when movement exceeds `max(3m, accuracy × 0.35)` (plus stationary/speed/turn/gap-recovery gates); optional background GPS while session active (`expo-task-manager`); live map uses lighter display simplify + tip segment to the EMA arrow; Expo Go shows a foreground-only banner when background GPS is off; live map arrow uses EMA-smoothed `displayCoordinate` + adaptive-EMA compass heading (platform accuracy gate, ~33 ms publish); optional Follow toggle (default off, ~450 ms ease). Active sessions debounce a local draft to AsyncStorage; cold start offers **Resume / Discard** (`LiveSessionResumeGate`). Route replay on completed sessions animates by **path distance** (~3–10s), not GPS timestamps.
- **Checkpoint camera:** `expo-camera` sequential selfie → progress (Expo Go + dev client); simultaneous dual-cam out of scope ([photo-checkpoint-dual-capture.md](../specs/photo-checkpoint-dual-capture.md)).
- **Home stats:** Service Hours / impact derive from `sessionStatsStore` (local finalize snapshots + `GET /sessions` with `photoCount`).
- **Volunteer session delete:** non-`approved` sessions can be removed via `DELETE /sessions/:id` + `removeVolunteerSession` (clears recent/cache/stats).

## Related

- [brand.md](../brand.md) · [design.md](../design.md) · [screen-map.md](../screen-map.md)
