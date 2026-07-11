# Implementation plan

High-level milestones for Clean Up - Give Back.

## Done

- [x] Monorepo layout: `frontend/`, `backend/`, `docs/`
- [x] Expo Router app with WebView-based Stitch HTML prototype
- [x] Metro config for `.html` asset bundling
- [x] Navigation bridge between HTML screens (postMessage)
- [x] Export all 39 Stitch screens to Figma as auto-layout frames (6 flow pages)
- [x] Figma Design System v1 — 104 variables, 14 text styles, BottomNav + Input components
- [x] Figma design ground-truth scaffold — `frontend/design/figma/`, `manifest.yaml`, ADR-002
- [x] Privacy & compliance documentation — `docs/compliance/`, ADR-003, main PRD §6.0a–6.37, 13 manifest routeKeys, screen-split decision
- [x] Figma compliance frames — Page 6 (`account-privacy`, `privacy-permissions`) + Page 7 (11 screens); node IDs in `manifest.yaml`

## Next

- [ ] Bind design tokens to remaining Figma screens (compliance frames use DS components; variable binding pending)
- [ ] **Approve and modify existing screens** — see [figma-compliance-screen-gap-audit.md](compliance/figma-compliance-screen-gap-audit.md#existing-screens-pending-approval)
- [ ] Native session flow: location permissions, map tracker, photo checkpoints — UI built as an isolated slice (`frontend/src/features/session-tracking/`, mocked data, real map via `mapcn-react-native`); real `expo-location`/`expo-camera` wiring and integration into `frontend/src/app/` still pending
- [ ] `backend/sessions/` — session lifecycle, evidence upload, activity log API
- [ ] `backend/maps/` — route tracking, geofencing, map tile/provider integration
- [ ] `backend/payments/` — shop checkout and donation processing
- [ ] Replace HTML prototype screens with React Native implementations per [manifest.yaml](../frontend/design/figma/manifest.yaml) and [figma-to-native-handoff.md](frontend/specs/figma-to-native-handoff.md)
- [ ] EAS builds with location/camera `app.json` plugins

## Privacy & compliance

- [ ] Counsel review of privacy policy + ToS before App Store submission
- [x] Figma Page 6 — `account-privacy` hub + `privacy-permissions`
- [x] Figma Page 7 — pre-auth compliance screens (age-gate, parental consent, policy viewers)
- [ ] Age-gate + parental consent backend (Supabase flags, parent verification state machine)
- [ ] App Store Declared Age Range API integration (iOS / Google Play age signals)
- [ ] Session-only geolocation enforcement (no background task when session inactive)
- [ ] CCPA deletion/export endpoints + admin audit log
- [ ] DPIA completed and signed off

## References

- PRD layouts: [frontend/specs/](frontend/specs/)
- Backend domains: [backend/context/](backend/context/)
- ADR index: [adr/overview.md](adr/overview.md)
