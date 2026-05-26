# CONTEXT.md — Master Template

Every directory in this repo contains a `CONTEXT.md` that gives any fresh Claude session
(or human contributor) an immediate, scoped orientation to that directory without reading
the code. Copy this template and fill each section for the directory's bounded context.

---

## Ontology

*The controlled vocabulary for this scope. Define every domain term that is used in the
code, decisions, or specs within this directory. Precision matters — vague or overlapping
definitions are the root cause of model hallucination and team misalignment.*

**Format:**
```
**Term** — One-sentence definition. Distinguish it from any near-synonym if ambiguous.
```

**Rules:**
- Define terms at the *most local* scope that owns them. Do not duplicate definitions
  from a parent directory's CONTEXT.md — reference it instead.
- Include the authoritative source (book, RFC, ADR) when precision is required.
- If a term is redefined from a parent scope (intentional narrowing), note the override
  explicitly: "Overrides root definition: …"

---

## Decisions

*Local architectural and design choices made within this scope. This is NOT a duplicate
of docs/adr/ — ADRs record high-leverage decisions with full rationale. This section
records the lower-stakes, local decisions that would otherwise be undocumented.*

**Format:**
```
**[YYYY-MM-DD] Decision title** — What was decided and why (1–2 sentences).
Ref: ADR-NNN (link to full ADR if one exists)
```

**Rules:**
- If a decision merits a full ADR (architectural scope, irreversible, team-wide impact),
  write the ADR and link it here. Do not reproduce the full rationale in this section.
- Keep entries chronological, newest last.
- If a decision is superseded, strike it and add the superseding decision inline.

---

## Patterns

*Code and design patterns that are actively enforced within this scope. A pattern is a
reusable solution to a recurring problem — not a one-off implementation choice.*

**Format:**
```
**Pattern name** — What problem it solves. How it is applied here.
Example: `path/to/example.ts`
```

**Rules:**
- Only list patterns that are *actually in use*, not aspirational ones.
- If a pattern is inherited from a parent scope, reference it; do not duplicate.
- When a pattern has a canonical name (Gang of Four, React, DDD), use it.

---

## Policies

*Hard rules governing this scope. These are non-negotiable constraints that any agent
or contributor must follow. Violations are bugs, not style preferences.*

**Format:**
```
**POLICY:** Rule statement.
**Why:** The consequence of violating this rule.
```

**Rules:**
- Policies must be falsifiable — you can check whether code violates them.
- Distinguish between *hard* policies (never violate) and *soft* guidelines (prefer).
  Soft guidelines belong in Patterns, not here.
- If a policy is specific to one file or function, document it at the call-site instead.

---

## Research

*Source-grounded references that informed the decisions, patterns, and policies in this
scope. An agent reading this section should know where the design knowledge comes from.*

**Format:**
```
**[Author/Source, Year]** "Title or topic" — Why it is relevant to this scope.
Link or path if available.
```

**Rules:**
- Only include references that *directly* shaped a decision or pattern above.
  Background reading goes in docs/notes/, not here.
- If a reference is cited in a parent CONTEXT.md, do not repeat it here unless the
  local scope adds a distinct insight from the same source.
