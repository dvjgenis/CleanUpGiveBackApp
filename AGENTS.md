# [PROJECT_NAME] — Agent Operational Guide

This is the heart of the Ralph Wiggum loop (ADR-001). Every agent running `loop.sh`
must follow these rules exactly before marking any task complete or committing.

---

## Build & Validation Commands

```bash
# Type-check (run first — fast feedback)
npx tsc --noEmit

# Lint
npm run lint

# Build (full Next.js production build — catches bundling errors)
npm run build
```

> **Note:** There is currently no `npm run test` script. The backpressure commands are
> `tsc --noEmit` + `npm run lint` + `npm run build`. When a test runner is added
> (Vitest is recommended for Next.js 16 + TypeScript strict), update this file and ADR-001.
>
> **Known pre-existing issue (2026-03-09):** `npm run lint` currently fails with
> `Cannot find module 'zod/v4/core'` — a Node 25 / eslint-config-next 16.1.6 incompatibility
> in `zod-validation-error`. This is not caused by any project source file. Use
> `npx tsc --noEmit` + `npm run build` as the authoritative backpressure until resolved.
> Track fix: update `eslint-config-next` when a compatible release ships.

---

## Backpressure Rules (MANDATORY)

1. After modifying **any** source file under `src/`, run all three commands above in order.
2. If `tsc --noEmit` fails: fix all type errors before proceeding. Do not suppress with `// @ts-ignore` or `any`.
3. If `npm run lint` fails: fix all ESLint violations before proceeding. Do not add `eslint-disable` comments.
4. If `npm run build` fails: fix all build errors before proceeding. Do not mark the task complete.
5. Do not commit code that does not pass all three commands. A partial output is a broken output.

---

## Knowledge Graph & Blast Radius Rules (MANDATORY)

1. **Graph-First Exploration**: Before using `grep`, `glob`, or `read` to explore the codebase, use `./code-review-graph` MCP tools (e.g., `query_graph`, `semantic_search_nodes`) to understand the structural context.
2. **Blast Radius Analysis**: Before modifying any existing logic or exported symbol, run `get_impact_radius` to identify all dependents.
3. **Complexity Threshold**: If a dependency chain is 3+ levels deep, you **MUST** enter Planning Mode and obtain user approval before modifying the root symbol.
4. **Graph Persistence**: Ensure the graph is updated after major refactors by running `./code-review-graph build`.

---

## Stack Constraints (enforced per turn)

Consult `.claude/rules/typescript-patterns.md` before writing any code. Key constraints:

- **No `any` types.** Define explicit interfaces for all props and state.
- **Tailwind CSS only.** Use design tokens — never ad-hoc hex values.
- **UI DOM manipulation inside `useEffect` only.** Never manipulate DOM outside a hook.
- **POUR accessibility.** `aria-label`, keyboard navigation, `aria-describedby` on all interactive elements.

---

## Architecture Decision Record (ADR) Rules

When implementing a feature that involves a material architectural decision, do the following immediately after implementation — while context is fresh:

1. Draft a new ADR using `docs/adr/template.md` as the base.
2. Save it as `docs/adr/ADR-NNN-verb-object-scope.md` (next sequential number).
3. Add a row to `docs/adr/overview.md` with Status, Date, Owners, and link.
4. The ADR must contain at least 2 options considered and one unambiguous "We will …" decision sentence.

If the decision is minor (a utility function, a naming convention), use the Mini-ADR format
(Context / Decision / Consequences / Revisit / References) — still in `docs/adr/`.

---

## Loop Hygiene

- Pick **exactly one task** from `IMPLEMENTATION_PLAN.md` per iteration.
- Do not start a second task in the same iteration, even if the first task was trivially fast.
- After completing a task: run all backpressure commands (see above), then mark it done in `IMPLEMENTATION_PLAN.md`, then commit.
- Commit message format: `feat: <task description>` (or `fix:`, `refactor:`, `chore:` as appropriate).
- If you discover an operational learning (a new constraint, a broken assumption, a better command), update this file immediately and commit the update before the task commit.

---

## Context Engineering Backpressure (MANDATORY)

After completing any task, before committing, update the `CONTEXT.md` in every directory
whose files were created or modified. A task is **not complete** until its CONTEXT.md is current.

**CONTEXT.md sections** — update the relevant section(s) for the change:

| Section | Update when… |
|---|---|
| **Ontology** | You introduce a new term, type, or concept in this scope |
| **Decisions** | You make a local design choice not covered by an existing ADR |
| **Patterns** | You establish or change a code pattern in this scope |
| **Policies** | You discover or enforce a new hard rule (e.g., a forbidden import) |
| **Research** | You cite a new reference or source in the implementation |

**CONTEXT.md locations:**

| Directory | File |
|---|---|
| Root | `/CONTEXT.md` |
| Source root | `src/CONTEXT.md` |
| Domain layer | `src/domain/CONTEXT.md` |
| Infrastructure layer | `src/infrastructure/CONTEXT.md` |
| UI layer | `src/ui/CONTEXT.md` |
| Docs | `docs/CONTEXT.md` |
| ADRs | `docs/adr/CONTEXT.md` |

Template for new CONTEXT.md files: `docs/context/TEMPLATE.md`

---

## Specs Backpressure

Before writing any new feature code, verify a spec exists in `specs/` for the activity.
If none exists:
1. Create `specs/NNN-<activity-verb-noun>.md` using `specs/TEMPLATE.md`.
2. Fill in JTBD, activity description, and acceptance criteria.
3. Commit the spec file *before* writing any implementation code.

The spec's acceptance criteria define the test requirements. Do not implement features
whose acceptance criteria have not been written.
