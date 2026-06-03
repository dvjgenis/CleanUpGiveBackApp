# ADR-001: Upfront App Store / Play Store Pricing

* **Status:** Accepted
* **Date:** 2026-05
* **Owners:** Clean Up - Give Back project team

## Context

The team originally scoped in-app payments via Stripe (~$29.99), which would require a custom payment backend and navigating platform fee rules for digital goods. That added complexity before core verification features were built.

## Options Considered

### Option 1: In-app Stripe checkout
* **Pros:** Could allow free download; flexible pricing later.
* **Cons:** Custom server, Apple/Google policy complexity, extra onboarding friction.

### Option 2: Upfront store price ($49.99)
* **Pros:** Revenue at install; no payment server; simpler user flow after purchase.
* **Cons:** No free trial download; users pay before creating an account.

## Decision

**We will monetize via a $49.99 upfront download fee on the Apple App Store and Google Play Store and will not implement Stripe or in-app payment flows unless this ADR is superseded.**

## Consequences

* Payment is handled entirely by the stores — no app-side checkout UI for program fees.
* Phase 5 deployment includes setting store listing price to $49.99.
* README and product copy must not reference separate “program fee” or Stripe flows.

## Revisit

After MVP launch if the nonprofit requests free download with paid verification, or if store policies block the model.

## References

* [project context](../context/project.md) — Policies (monetization)
* [implementation plan](../implementation-plan.md) — Phase 5
