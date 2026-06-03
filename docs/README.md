# Documentation

All context-engineering docs live here. **README.md** stays at the repo root; **Cursor rules** stay in `.cursor/rules/`.

## Quick start (chat / agents)

You do **not** need to `@` every file each message. Rules in `.cursor/rules/` load automatically.

For feature work, point at one spec or the plan once per session, e.g.:

> Implement Phase 1 per `docs/specs/001-core-auth-profiles.md`.

## Context

| Doc | Purpose |
|-----|---------|
| [context/project.md](./context/project.md) | Domain vocabulary, policies, global decisions |
| [context/app.md](./context/app.md) | Expo Router routes and navigation |
| [context/assets.md](./context/assets.md) | Brand kit vs app assets (`assets/brand/`, `assets/images/`) |
| [brand.md](./brand.md) | Logo, colors, typography, voice (official brand book) |
| [accounts-and-access.md](./accounts-and-access.md) | Org accounts, contacts, 2FA workflow (no passwords) |
| [context/TEMPLATE.md](./context/TEMPLATE.md) | Template for new scoped context files |

## Status & planning

| Doc | Purpose |
|-----|---------|
| [current.md](./current.md) | What the codebase does today vs gaps |
| [implementation-plan.md](./implementation-plan.md) | Phased task checklist |
| [progress.md](./progress.md) | Session log and open items |

## Agents

| Doc | Purpose |
|-----|---------|
| [agents.md](./agents.md) | Commands, verification, backpressure |

## Specs & ADRs

| Doc | Purpose |
|-----|---------|
| [specs/](./specs/) | Feature specs (write before coding) |
| [adr/overview.md](./adr/overview.md) | Architecture decision index |
