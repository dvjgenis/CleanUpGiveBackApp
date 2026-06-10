# Agent instructions

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v54.0.0/ before writing frontend code.

## Repository layout

| Area | Path |
|------|------|
| Expo app | `frontend/` |
| Backend (planned) | `backend/{maps,payments,sessions}/` |
| Living docs | `docs/` — start at [README.md](../README.md) |
| Cursor config | `.cursor/` (repo root only) |

## Workflow

1. **Spec-first** — `docs/frontend/specs/` or `docs/backend/specs/`
2. **MCP-first** for externals — see `.cursor/rules/mcp.mdc`
3. **Verify** — `cd frontend && npx tsc --noEmit` before marking done
4. **Sync docs** — `.cursor/rules/docs-backpressure.mdc`

## Path aliases

- `@/*` → `frontend/src/*`
- `@/assets/*` → `frontend/assets/*`
