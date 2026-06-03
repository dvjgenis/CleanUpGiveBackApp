# Implementation plan

- [x] **Phase 0:** Environment setup — Expo 51 shell, TypeScript, branded Home, docs under `docs/`.
- [ ] **Phase 1:** **Auth & database foundations** — [specs/001-core-auth-profiles.md](./specs/001-core-auth-profiles.md)
  - [ ] Set up Firebase Auth and Firestore (`.env` from `.env.example`)
  - [ ] User profile schema (legal name, program type, mandated hours)
- [ ] **Phase 2:** **Core session tracking (GPS loop)**
  - [ ] Google Maps route tracking (1-meter update rate)
  - [ ] Live-camera start session (vest and chin selfie)
  - [ ] Interval check-ins (1-hour lock for court-ordered users)
- [ ] **Phase 3:** **End session & logs**
  - [ ] Final trash bag live photo upload
  - [ ] Session conclusion and Firebase log sync
- [ ] **Phase 4:** **Admin & confirmation letter** — [spec 002](./specs/002-admin-session-approval.md), [spec 003](./specs/003-service-confirmation-letter.md)
  - [ ] Admin review flow (map, selfies, approve/reject)
  - [ ] Org letter template + signature in `assets/brand/letter/`
  - [ ] On-device PDF via `expo-print` ([ADR-002](./adr/ADR-002-on-device-pdf-via-expo-print.md))
- [ ] **Phase 5:** **Deployment**
  - [ ] $49.99 upfront app store price
  - [ ] EAS production build and store submission
