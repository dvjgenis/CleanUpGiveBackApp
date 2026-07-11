# ADR-003: Minor data protection — strictest-baseline nationwide

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

Clean Up - Give Back collects photos and precise geolocation to verify community service hours. Our audience includes school and youth groups. Federal COPPA rules apply to users under 13; state teen-privacy laws (CA AADC, CT, MD, NJ, and others) apply to users 13–17; CCPA/CPRA and similar laws apply to all users. Emerging App Store age-verification laws (TX, UT, LA) will require ingesting platform age signals.

Building 50 state-specific app variants is not feasible. We need one compliance posture that satisfies the strictest applicable requirements.

## Decision

Adopt a **strictest-baseline nationwide** strategy:

1. **Neutral age-gate** before any PII collection — month/year of birth only.
2. **Parental consent flow** for users under 13 before selfies or GPS.
3. **Teen privacy tier** (13–17) with highest privacy defaults and plain-language notice.
4. **Session-only geolocation** with a persistent on-screen tracking indicator.
5. **Account-tab privacy hub** (`account-privacy`) as the primary in-app privacy destination.
6. **CCPA baseline rights** for all users (access, deletion, portability, do-not-sell, non-discrimination).
7. **App Store age signals** ingested for enforcement and discarded after use — never persisted long-term.
8. **Supabase backend** designed day-one for cascade deletion, RLS, and retention jobs.

Legal policy text and consent verification methods require counsel approval before launch.

## Consequences

### Positive

- Single app build for all US jurisdictions.
- Proactive protection for minors before feature launch.
- Clear engineering and design requirements documented in `docs/compliance/`.
- Backend privacy spec aligned with frontend flows from the start.

### Negative

- Additional onboarding screens (age-gate, parental consent, teen notice).
- ~13 new Figma screens to design and implement.
- Existing screens (`account`, `create-account`, `privacy-security`, etc.) need updates — pending product approval.
- Parental consent verification adds integration complexity and possible vendor cost.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Age field on account-details only | Does not meet COPPA pre-collection requirements; collects PII before age verification |
| Block all users under 18 | Excludes school/youth groups — core audience |
| State-specific builds | Unmaintainable; error-prone |
| Defer compliance until post-launch | Legal exposure; App Store rejection risk |

## Related

- [privacy-and-data-protection.md](../compliance/privacy-and-data-protection.md)
- [privacy-screen-split-decision.md](../compliance/privacy-screen-split-decision.md)
- [privacy-compliance-prd-addendum.md](../frontend/specs/privacy-compliance-prd-addendum.md)
- [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md)
