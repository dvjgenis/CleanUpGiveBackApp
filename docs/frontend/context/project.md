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

## Stack

- **Frontend:** Expo SDK 54, React Native 0.81, TypeScript, Expo Router (`frontend/`)
- **Backend:** Planned Node/services under `backend/` (maps, payments, sessions)
- **Docs:** `docs/` living documentation

## Decisions

- Monorepo layout — see [ADR-001](../adr/ADR-001-monorepo-layout.md)
- Path aliases: `@/*` → `frontend/src/*`, `@/assets/*` → `frontend/assets/*`

## Related

- [brand.md](../brand.md) · [design.md](../design.md) · [screen-map.md](../screen-map.md)
