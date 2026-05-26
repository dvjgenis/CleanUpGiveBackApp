# Spec: [Activity Title]

<!-- Scope test: can you describe this spec in one sentence without using "and"? -->
<!-- If not, split it into two specs. -->

**JTBD:** As a [role], I want to [outcome] so that [motivation].

**Activity:** [Single verb phrase describing the user action — e.g., "view portfolio hero section"]

**Scope:** [One sentence. No "and".]

---

## Context

[2–4 sentences. What is the user doing before this activity? What state is the system in?
What triggers this activity?]

---

## Acceptance Criteria

<!-- Define WHAT to verify, never HOW to implement. -->
<!-- Format: "Given [state], when [action], then [observable result]." -->
<!-- Include performance budgets, accessibility requirements, and edge cases. -->

- [ ] **AC-01:** Given [state], when [action], then [result].
- [ ] **AC-02:** Given [state], when [action], then [result].
- [ ] **AC-03:** [Accessibility] All interactive elements pass WCAG 2.1 AA. Keyboard
      navigation reaches every control. `aria-label` present on all unlabeled elements.
- [ ] **AC-04:** [Performance] [Specific measurable threshold, e.g., "LCP < 2.5s on a
      simulated 4G connection"].

---

## Design Notes

[Optional. Reference relevant design tokens, component names, or visual constraints.
Do not specify implementation — only observable design outcomes.]

---

## Out of Scope

[Explicitly list what this spec does NOT cover. Prevents scope creep during implementation.]

---

## References

- Relevant ADR(s): `docs/adr/ADR-NNN-*.md`
- Design data: `.claude/skills/ui-ux-pro-max/data/`
- Related specs: `specs/NNN-*.md`
