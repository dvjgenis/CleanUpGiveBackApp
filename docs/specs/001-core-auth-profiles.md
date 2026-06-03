# Spec 001: Core Authentication & Profile Routing

**JTBD:** As a participant, I want to create a secure account and register my program type so that my tracked service hours are verifiable by courts, schools, or other organizations that require service hours.

**Activity:** Complete participant signup and profile setup.

**Scope:** Email/password registration, program-type selection, and Firestore profile creation for new participants.

---

## Context

The primary audience for this flow is participants who require verified service hours for courts, schools, or similar organizations. A new user opens the app after purchasing from the App Store or Play Store (see ADR-001). Without an existing account, they must sign up, select the appropriate program type (court-ordered, school-related, or other organization), and submit any required profile fields for their organization. Upon completing this flow, the participant reaches the main app shell with a persisted session and a unique, generated participant ID.

---

## Acceptance Criteria

- [ ] **AC-01:** Given the user is on the signup screen with valid email and password, when they submit the form, then a Firebase Auth user is created and they proceed to program-type selection.
- [ ] **AC-02:** Given the user is on program-type selection, when they choose "Court-Ordered," then additional required fields appear (target court system, mandated hours; optional probation officer details).
- [ ] **AC-03:** Given the user is on program-type selection, when they choose "School/Work/Public Volunteer," then court-specific fields are not shown and are not required.
- [ ] **AC-04:** Given signup and program details are complete, when the profile is saved, then a Firestore user document exists with the participant’s legal name, program type, organization-specific fields, and a unique participant ID.
- [ ] **AC-05:** Given a returning user with valid credentials, when they sign in, then they reach the authenticated home experience without repeating onboarding.
- [ ] **AC-06:** Given invalid credentials or network failure, when sign-in or sign-up fails, then the user sees a clear error message and can retry without app crash.
- [ ] **AC-07:** [Accessibility] All form controls have visible labels; error text is associated with fields; primary actions are reachable on iOS and Android with screen reader enabled.
- [ ] **AC-08:** [Security] Firebase and API keys load from environment variables only (see `.env.example`); no secrets in source control.

---

## Design Notes

- Use existing themed components (`ThemedText`, `ThemedView`) for consistency with the Home shell.
- Participant ID should be human-readable enough for admin or organization lookup (format TBD in implementation; must be unique in Firestore).

---

## Out of Scope

- Password reset email flow (follow-up spec)
- Social login (Google/Apple)
- Admin user creation or role assignment
- Profile photo upload
- Payment or store receipt validation inside the app
- Cleanup session tracking (Phase 2)

---

## References

- [ADR-001](../adr/ADR-001-upfront-app-store-monetization.md)
- [project context](../context/project.md)
- [implementation plan](../implementation-plan.md) — Phase 1
- Related specs: [002-admin-session-approval.md](./002-admin-session-approval.md), [003-service-confirmation-letter.md](./003-service-confirmation-letter.md)
