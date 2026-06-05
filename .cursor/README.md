# Cursor agent config

Rules in `rules/` apply automatically (see each file’s `alwaysApply` / `globs` frontmatter).

| File | Purpose |
|------|---------|
| [rules/one.mdc](./rules/one.mdc) | Project identity & stack |
| [rules/two.mdc](./rules/two.mdc) | Code conventions (TS/TSX, Expo Router, theming) |
| [rules/three.mdc](./rules/three.mdc) | Agent workflow (spec-first, verify, docs) |
| [rules/docs-backpressure.mdc](./rules/docs-backpressure.mdc) | Living docs after code changes |
| [rules/mcp.mdc](./rules/mcp.mdc) | **MCP tools** — when to use them and which server |

## MCP plugins

All user MCP servers are configured in:

**`/Users/dvgenis/.cursor/mcp.json`**

Keys in that file map to runtime servers as `user-<key>` (e.g. `github` → `user-github`). Cursor-built-in and plugin servers (e.g. `cursor-ide-browser`, `plugin-sanity-Sanity`) are enabled in Cursor Settings and are not listed in `mcp.json`.

Before calling any MCP tool, read its schema under the project MCP descriptors folder. Task → server mapping: [rules/mcp.mdc](./rules/mcp.mdc).

## Hooks

[hooks.json](./hooks.json) runs [hooks/docs-backpressure.sh](./hooks/docs-backpressure.sh) after edits to remind agents to sync `docs/`.
