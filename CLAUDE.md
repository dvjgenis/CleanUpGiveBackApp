# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: [PROJECT_NAME] Workspace

A premium UX portfolio built with Next.js App Router, TypeScript strict mode, Tailwind CSS, and Zustand state.

---

## Build & Validation Commands

```bash
# Type-check (authoritative backpressure — run first)
npx tsc --noEmit

# Build (catches bundling errors)
npm run build

# Lint — CURRENTLY BROKEN (zod/v4/core incompatibility on Node 25 with eslint-config-next 16.1.6)
# Do NOT use npm run lint until eslint-config-next ships a compatible release.
# Use tsc + build as the backpressure pair until then.
```

After modifying **any** file under `src/`, run `npx tsc --noEmit` then `npm run build` in order. Fix all errors before marking a task complete. Never suppress with `// @ts-ignore`, `any`, or `eslint-disable`.

**Verification Iron Law** (source: `references/superpowers/skills/verification-before-completion/SKILL.md`):

- Never write `"Done"`, `"Fixed"`, `"Should pass"`, `"Looks correct"`, or any success-implying phrase without running the verification command **in the same message** and reading its full output.
- `tsc --noEmit` passing ≠ build passing. Run both. Check exit codes. Count failures.
- Agent delegation: a subagent reporting "success" is not verification. Check the VCS diff independently.
- Partial verification proves nothing. No shortcuts, no exceptions.

---

## Code Review Graph Setup (One-Time)

The repo uses `code-review-graph` for structural analysis, impact radius detection, and smart code review. Setup is automatic via hooks.

### Installation

```bash
npm install -g crg-dev-kit@latest
```

This installs the `crg-dev-kit` CLI. The `.claude/helpers/crg-wrapper.sh` script wraps it via `npx crg-dev-kit` to ensure compatibility.

### Hooks (Auto-Enabled)

- **PostToolUse:** Runs `code-review-graph update --skip-flows` after any file edit/write
- **SessionStart:** Runs `code-review-graph status` at session startup

Both hooks execute via the wrapper script and are non-blocking (timeout 10–30s).

### Usage

Before implementing a feature or reviewing a change:

```bash
bash .claude/helpers/crg-wrapper.sh build              # Initial graph build
bash .claude/helpers/crg-wrapper.sh update --skip-flows # Incremental update
bash .claude/helpers/crg-wrapper.sh status              # Check graph health
```

The MCP tool `code-review-graph` provides additional tools for:

- `detect_changes` — Risk-scored change analysis
- `get_impact_radius` — Blast radius of a change
- `query_graph` — Callers, callees, imports, test coverage
- `semantic_search_nodes` — Find functions/classes by intent

Prefer these graph tools over manual Grep/Glob when exploring or reviewing code.

---

## Playwright Visual Verification (MANDATORY during editing phase)

**When editing existing pages or building new features into existing pages, Playwright MCP visual verification is not optional — it is a required backpressure step on par with `tsc --noEmit`.**

### Trigger conditions (any one is sufficient)

- Modifying any file inside `src/app/` (page routes)
- Modifying any organism, molecule, or atom used by an existing page
- Implementing any visual feature: layout, animation, spacing, color, typography, cursor, hover state
- Debugging any visual or interaction bug on an existing page
- Wiring new content or props into a page that is already rendered

### Required sequence (execute in order, no skipping)

```
1. Start dev server if not running:  npm run dev
2. mcp__playwright__browser_navigate  →  http://localhost:3000/<page>
3. mcp__playwright__browser_take_screenshot  →  inspect result before writing any code
4. Implement the change in React/CSS
5. mcp__playwright__browser_navigate (reload)  →  http://localhost:3000/<page>
6. mcp__playwright__browser_take_screenshot  →  confirm change is visually correct
7. If broken: mcp__playwright__browser_console_messages  →  read all console errors before guessing
8. npx tsc --noEmit  →  npm run build  →  both must pass
```

### Rules

- **Never claim a visual change is correct without a post-implementation screenshot.**
- **Never guess at a layout/animation bug** — read console errors via `mcp__playwright__browser_console_messages` first.
- Screenshots are evidence, not decoration. If the screenshot does not match the intent, do not advance to tsc/build.
- For multi-page features (navbar, footer, global tokens), capture screenshots of **all affected routes** before marking complete.
- `mcp__playwright__browser_snapshot` (accessibility tree) supplements but does not replace screenshots for visual work.

### Pages to check (by default, always verify these after any global change)

| Route | URL |
|---|---|
| Homepage | `http://localhost:3000/` |
| Works | `http://localhost:3000/works` |
| About | `http://localhost:3000/about` |

---

## Ralph Wiggum Loop (ADR-001)

`loop.sh` runs `PROMPT_build.md` headlessly via `claude -p --dangerously-skip-permissions`. Each iteration gets a fresh context window for exactly one task.

```bash
# Only run on a non-main feature branch
git checkout -b feature/<phase>
./loop.sh
```

The loop reads `AGENTS.md` for its backpressure rules. Tasks are pulled one at a time from `IMPLEMENTATION_PLAN.md`. Do not start the loop on `main` or `master`.

---

## Interaction Protocol

Every response follows **Preview → Confirmation Gate → Execute**. Rules in `.claude/rules/hci-protocol.md`. Key constraints:

- Transform every request into `<context>/<task>/<constraints>/<output>` XML block before responding.
- End every preview with the verbatim gate: **Shall I proceed with the implementation as described above? (Yes / No / Request changes)**
- Remain idle until `Yes`, `Proceed`, or `Approved`. Never blend preview and execution in one reply.

Full examples: `.claude/rules/examples.md`

---

## Architecture

```
src/
  domain/         # Business logic, types, bounded contexts (DDD)
  infrastructure/ # API clients, persistence, external service adapters
  ui/             # React components, hooks, Zustand stores
docs/
  adr/            # Architecture Decision Records (ADR-001…)
  context/        # Per-directory CONTEXT.md files
.claude/
  rules/          # Enforced rule files (load the relevant one per task)
  skills/         # Local orchestration agents and ui-ux-pro-max data
references/
  antigravity-awesome-skills/  # 1000+ engineering specialist skills
  design-advisor/              # Design Advisor data and guides
  superpowers/                 # obra/superpowers: 10 operational skills (debug, plan, review, worktrees)
  claude-mem/                  # thedotmack/claude-mem: persistent memory worker + MEMORY.md
  awesome-claude-code/         # hesreallyhim/awesome-claude-code: curated CLAUDE.md patterns
```

**DOM manipulation** must be inside `useEffect` only.

---

## Skill Search (MANDATORY before specialist tasks)

Before any non-trivial coding, architecture, accessibility, or design task:

```bash
# Engineering specialist (1000+ skills)
python3 references/antigravity-awesome-skills/scripts/search.py <keywords> --limit 5

# Design / UI-UX specialist
python3 .claude/skills/ui-ux-pro-max/scripts/search.py <keywords>

# Operational skills (debugging, planning, review, parallel agents, worktrees)
ls references/superpowers/skills/
# Read: references/superpowers/skills/<skill-name>/SKILL.md
```

Read the top-matching `SKILL.md` and apply its constraints. This is not optional.

**Superpowers trigger map** — pull the matching skill before acting:

| Trigger condition | Skill to read |
|---|---|
| Any bug, test failure, or unexpected behavior | `references/superpowers/skills/systematic-debugging/SKILL.md` |
| ≥2 independent problems to fix simultaneously | `references/superpowers/skills/dispatching-parallel-agents/SKILL.md` |
| Implementing tasks from `IMPLEMENTATION_PLAN.md` | `references/superpowers/skills/subagent-driven-development/SKILL.md` |
| About to claim any task is complete | `references/superpowers/skills/verification-before-completion/SKILL.md` |
| Writing a new implementation plan | `references/superpowers/skills/writing-plans/SKILL.md` |
| Starting any feature branch work | `references/superpowers/skills/using-git-worktrees/SKILL.md` |
| Implementation complete, ready to ship or merge | `references/superpowers/skills/finishing-a-development-branch/SKILL.md` |
| Implementing or debugging any visual feature on an existing page | Launch `mcp__playwright__browser_navigate` + `mcp__playwright__browser_take_screenshot` before and after every change — see **Playwright Visual Verification** section |
| Implementation complete, before `/wrap` | Run `/simplify` — three parallel agents against `git diff` (reuse, quality, efficiency) |
| Memory feels stale or `MEMORY.md` is growing large | Run `/remember` — reviews all memory entries, proposes deletions/merges/corrections |
| Just completed a multi-step session workflow worth repeating | Run `/skillify` — four-round interview → generates a reusable `.claude/commands/*.md` |

---

## Systematic Debugging Protocol

**Source:** `references/superpowers/skills/systematic-debugging/SKILL.md`

Before proposing any fix, complete all 4 phases in order:

1. **Root Cause Investigation** — Read errors completely. Reproduce consistently. Check recent changes (`git diff`). Add diagnostic instrumentation at every component boundary before guessing.
2. **Pattern Analysis** — Find working examples in this codebase. List every difference between working and broken cases. Do not assume "that can't matter."
3. **Hypothesis and Testing** — Form one specific hypothesis ("I think X because Y"). Test the smallest possible change. One variable at a time.
4. **Implementation** — Fix root cause, not symptom. Create a failing test first. Verify fix. If it does not work, form a new hypothesis — do not stack fixes.

**3+ failed fix attempts = architectural problem.** Stop, discuss the pattern with Superman before a fourth attempt.

**Red flags that mean STOP and return to Phase 1:** "quick fix for now", "just try changing X and see", "I don't fully understand but this might work", "one more fix attempt", proposing solutions before tracing data flow.

---

## Code Constraints

- **No `any` types.** Define explicit interfaces for all props and state.
- **Tailwind CSS only.** Use design tokens — no ad-hoc hex values.
- **POUR accessibility.** `aria-label`, keyboard navigation, `aria-describedby` on all interactive elements. WCAG 2.1 AA minimum.
- **No placeholders or emojis in UI.** Use pristine SVGs or branded logos only.
- **Full output only.** Never produce `// ...`, `// TODO`, `// rest of code`, or prose truncation shortcuts. A partial output is a broken output.
- **Cursor pointer** on all clickable elements. Hover transitions 150–300ms.

---

## ADR Workflow

For any material architectural decision, immediately after implementation:

1. Copy `docs/adr/template.md` → `docs/adr/ADR-NNN-verb-object-scope.md` (next sequential number).
2. Include at least 2 options considered and one unambiguous "We will …" sentence.
3. Add a row to `docs/adr/overview.md`.

Minor decisions (utility functions, naming) use the Mini-ADR format but still go in `docs/adr/`.

---

## Context Engineering Architecture

Every directory has a `CONTEXT.md` with five canonical sections. A fresh agent reads
the relevant CONTEXT.md before touching files in that directory. Template: `docs/context/TEMPLATE.md`.

| Section | What it contains |
| --- | --- |
| **Ontology** | Controlled vocabulary: precise definitions of every domain term owned by this scope |
| **Decisions** | Local choices (quick refs + links to full ADRs for high-leverage decisions) |
| **Patterns** | Reusable solutions actively enforced in this scope |
| **Policies** | Hard rules — falsifiable, non-negotiable constraints |
| **Research** | Source-grounded references that shaped the decisions and patterns above |

**CONTEXT.md files in this repo:**

| File | Scope |
| --- | --- |
| `/CONTEXT.md` | Project-level vocabulary, all ADR decision refs, global policies |
| `src/CONTEXT.md` | DDD layer boundaries, import direction, strict mode |
| `src/domain/CONTEXT.md` | Portfolio domain types (Project, CaseStudy, Component…) |
| `src/infrastructure/CONTEXT.md` | Adapter pattern, API client, streaming response |
| `src/ui/CONTEXT.md` | Atomic Design, Zustand stores, Tailwind tokens, POUR |
| `docs/CONTEXT.md` | ADR lifecycle, CONTEXT.md update cadence |
| `docs/adr/CONTEXT.md` | ADR status values, one-decision-per-file rule |

**Updating CONTEXT.md is a mandatory backpressure step.** After completing any task,
update the CONTEXT.md in every directory whose files were created or modified.
A task is not complete until its CONTEXT.md is current.

---

## Specs (Requirements)

`specs/` contains one Markdown file per user activity (JTBD → topic of concern breakdown).
Specs are the source of truth for what should be built. Acceptance criteria in specs
drive test requirements. Template: `specs/TEMPLATE.md`.

**Scope test:** Can you describe the spec's topic in one sentence without "and"? If not, split it.

**Acceptance criteria format:** "Given [state], when [action], then [observable result]."
Define WHAT to verify, never HOW to implement.

**Spec-first rule:** New features start as a `specs/*.md` file with acceptance criteria
*before* `IMPLEMENTATION_PLAN.md` is written. The plan is derived from the spec.

---

## FIC Workflow (multi-session tasks)

For tasks touching more than 3 files or spanning multiple sessions, use Frequent Intentional Compaction:

```text
/research_codebase <topic>  →  /compact
/create_plan <topic>        →  confirm gate  →  /compact
/implement_plan <topic> phase:N  →  /compact
```

Artifacts live in `.claude/thoughts/shared/research/` and `.claude/thoughts/shared/plans/`. Never save FIC artifacts to the root.

### Preferred plan execution: Subagent-Driven Development

When `IMPLEMENTATION_PLAN.md` has ≥2 independent tasks, use subagent-driven-development instead of direct execution:

1. Read `references/superpowers/skills/subagent-driven-development/SKILL.md` before starting.
2. Extract all tasks with their full text upfront — do not have subagents read the plan file themselves.
3. Per task: dispatch implementer subagent → spec compliance review → code quality review → mark complete in TodoWrite.
4. Model selection: 1-2 files + clear spec → `haiku`. Multi-file integration → `sonnet`. Architecture or judgment → `opus`.
5. After all tasks complete: dispatch final reviewer → apply `finishing-a-development-branch` skill.

**Never** dispatch implementation subagents in parallel (causes file write conflicts).

---

## Git Worktrees

**Source:** `references/superpowers/skills/using-git-worktrees/SKILL.md`

Before starting any feature branch work (loop, FIC, or multi-task implementation):

1. Check for `.worktrees/` directory — create it if absent. (`.worktrees/` wins over `worktrees/` if both exist.)
2. Verify it is gitignored: `git check-ignore -q .worktrees`. If not ignored, add it to `.gitignore` and commit before proceeding.
3. Create worktree: `git worktree add .worktrees/<branch-name> -b feature/<branch-name>`
4. Run `npm install` then `npx tsc --noEmit` as a baseline inside the new worktree.
5. On completion, use the `finishing-a-development-branch` skill for the 4-option cleanup flow (merge / PR / keep / discard).

---

## Persistent Memory (claude-mem)

**Source:** `references/claude-mem/`

A session memory worker captures tool usage across sessions and maintains a `MEMORY.md` in the workspace with a structured observation timeline.

```bash
# Check worker health
curl http://localhost:37777/api/health   # → {"status":"ok"}

# Start worker if not running
cd ~/.claude/plugins/marketplaces/thedotmack && npm run worker:restart

# Viewer UI (live observation timeline)
open http://localhost:37777
```

- `MEMORY.md` is auto-synced at session start and on every tool use. Treat it as authoritative cross-session context when present.
- **Semantic search past sessions:** invoke the `mem-search` skill (`references/claude-mem/plugin/skills/mem-search/SKILL.md`).
- **Privacy:** Wrap sensitive content in `<private>content</private>` tags — stripped before reaching the database.
- Worker absence is non-blocking — memory is advisory. If `MEMORY.md` is absent or stale, fall back to `PROGRESS.md` and `IMPLEMENTATION_PLAN.md`.

### Memory Exclusion Rules (enforced by `/remember`)

Never save to memory — delete immediately if found:

| Excluded content | Why |
|---|---|
| Code patterns, file paths, architecture descriptions | Derivable from reading the current codebase — becomes stale |
| Git history, who-changed-what | `git log` / `git blame` are authoritative |
| Debugging solutions or fix recipes | The fix is in the code; the commit message has context |
| Ephemeral task details or in-progress work state | Only useful within the current conversation |
| PR lists or activity summaries | Frozen in time — trust `git log` instead |

### MEMORY.md Size Rules

`MEMORY.md` is an **index**, not a knowledge base:

- Each entry: **one line, under 150 characters**
- Hard cap: **200 lines** — entries beyond line 200 are truncated by the harness and silently lost
- If the index exceeds 200 lines, run `/remember` to consolidate or delete low-value entries

### Memory Taxonomy

Only four memory types are valid. When saving, pick the correct one:

| Type | Save when | Never save |
|---|---|---|
| `user` | Role, goals, preferences, expertise level | Negative judgements |
| `feedback` | Corrections or confirmed non-obvious approaches | Obvious conventions |
| `project` | Who is doing what, why, by when (use absolute dates) | Ephemeral task state |
| `reference` | Where to find things in external systems | Anything in this repo |

---

## Hook Lifecycle Reference

**Source:** `tanbiralam/claude-code` → `src/skills/bundled/updateConfig.ts`

`settings.json` is the **authoritative behavioral configuration** for Claude Code. Prose rules in `CLAUDE.md` are re-interpreted each turn — hook configs in `settings.json` are executed deterministically by the harness. For automation, always use hooks, not prose instructions.

Nine hook events are available:

| Event | Fires when | Common use |
|---|---|---|
| `PreToolUse` | Before any tool executes | Permission checks, block destructive commands, log intent |
| `PostToolUse` | After any tool completes | Auto-format, run linter, update CONTEXT.md |
| `PreCompact` | Before context compaction | Write a state snapshot to a file before compression loses detail |
| `PostCompact` | After context compaction | Re-inject critical constraints; confirm key decisions survived |
| `Stop` | When the assistant stops responding | Trigger `/wrap`, notify, run final tsc check |
| `PermissionRequest` | When a tool needs permission | Custom approval flows, auto-approve low-risk tools |
| `Notification` | When a background notification fires | Route to Slack, desktop notification, log file |
| `UserPromptSubmit` | Before user message is sent | Inject context, validate input, route to correct agent |
| `SessionStart` | When a session begins | Restore state, load MEMORY.md, run health checks |

**Underused events** — `PreCompact` and `PostCompact` are the highest-leverage hooks for context engineering. A `PreCompact` hook can write a dense state summary before compression; a `PostCompact` hook can re-inject constraints that should survive every compaction.

Use `/update-config` skill to configure hooks without editing `settings.json` manually.

---

## File Organization

- `src/` — all source code
- `specs/` — activity specs (JTBD breakdown, acceptance criteria)
- `tests/` — test files
- `docs/` — documentation, ADRs, CONTEXT.md template
- `config/` — configuration files
- `scripts/` — utility scripts

Never save working files, markdown notes, or tests to the root folder.

# Codebase Knowledge Graph

- Full graph index: .gitnexus/ (KuzuDB via MCP)
- Structural map: .code-review-graph/ (SQLite via MCP)
- Before making any change: check blast radius using graph
- Never modify a function without checking what depends on it
- If a dependency chain is 3+ levels deep, use plan mode first
- Use codegraph_explore or graph MCP tools before grepping files

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
./code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

### Graph Commands (Aliases)

The following slash-commands are supported as convenient aliases for complex graph queries:

- `/graph blast <symbol>`: Runs `get_impact_radius`. Use this to check the risk and blast radius of any change.
- `/graph callers <symbol>`: Runs `query_graph` with `pattern="callers_of"`. Use this to find all dependents across the codebase.
- `/graph search <intent>`: Runs `semantic_search_nodes`. Use this to find relevant functions or classes by behavioral intent rather than raw grep.
