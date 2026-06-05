# Agent workflow & project setup

## Core commands

* **Start development server:** `npx expo start` (Expo Go or simulators)
* **Run iOS simulator:** `npm run ios`
* **Run Android emulator:** `npm run android`
* **Run web:** `npm run web`
* **Testing:** `npm run test`
* **Linting:** `npm run lint`
* **Reset project:** `npm run reset-project`

## Repo paths

* **Root:** `CleanUpGiveBackApp/` — do not use nested `Clean-Up-Give-Back/` paths
* **Routing:** `app/` (Expo Router)
* **Shared UI:** `components/`
* **Docs:** `docs/` — see [README.md](./README.md)

## MCP tools

Prefer **MCP tools** for external services and live data — do not improvise APIs when a server is available.

* **Config:** `/Users/dvgenis/.cursor/mcp.json` (all user MCP plugins)
* **Rules:** [.cursor/rules/mcp.mdc](../.cursor/rules/mcp.mdc) — task → server map
* **Index:** [.cursor/README.md](../.cursor/README.md)

| Need | MCP server (`mcp.json` key) |
|------|----------------------------|
| GitHub issues/PRs/search | `github` |
| Web or local search | `brave-search` |
| Slack | `slack` |
| WhatsApp | `whatsapp` |
| In-IDE browser testing | `cursor-ide-browser` (built-in) |
| Headless web E2E | `playwright` |
| Sanity CMS | `plugin-sanity-Sanity` (Cursor plugin) |
| NotebookLM | `notebooklm-mcp` |
| Gemini media | `gemini` |
| Overleaf | `overleaf` |
| Session memory | `memory-bank` |
| Deep reasoning | `sequential-thinking` |

Always read the tool schema before `CallMcpTool`. Runtime server ids are usually `user-<key>`.

## Backpressure

* Expo React Native only — no Next.js or Tailwind; use MCP `playwright` / `cursor-ide-browser` only for web/browser tasks, not RN unit tests
* GPS only during active cleanup sessions — not continuous background tracking
* Secrets: `.env` (app keys) and `credentials.local.md` (org logins) — both gitignored; template: [credentials.local.template.md](../credentials.local.template.md). See [accounts-and-access.md](./accounts-and-access.md).
* **Verify before done:** `npx tsc --noEmit`; `npm run lint` / `npm test` when relevant
* **Living docs:** `.cursor/rules/docs-backpressure.mdc` after code changes

## Specs & plans

* Feature specs: [docs/specs/](./specs/)
* Tasks: [implementation-plan.md](./implementation-plan.md)
* ADRs: [adr/overview.md](./adr/overview.md)
