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

### Sessions + geolocation (Expo Go test phase)

Docs complete — see [ADR-004](adr/ADR-004-sessions-backend-supabase-fly.md), [ADR-005](adr/ADR-005-expo-go-webview-map.md), [sessions-api.md](backend/specs/sessions-api.md), [session-tracking-expo-go.md](frontend/specs/session-tracking-expo-go.md), [supabase.md](supabase.md).

- [x] Architecture ADRs (Supabase + Fly, Expo Go WebView map)
- [x] Backend API spec + Supabase schema documentation
- [x] Frontend Expo Go integration spec
- [x] Supabase project: Prisma schema pushed; run `sql/supabase-init.sql` for storage RLS if needed
- [x] `backend/sessions/` — Fastify + Prisma sessions API implemented
- [ ] Deploy API to Fly.io (`fly deploy` — org machine limit may require plan upgrade)
- [x] Frontend: `lib/supabase.ts`, `lib/api.ts`, wire `liveSessionStore` to API
- [x] Frontend: `LiveSessionMapWebView` for Expo Go (ADR-005)
- [ ] End-to-end test in Expo Go on physical device (after Fly deploy + `EXPO_PUBLIC_API_URL`)

### Other

- [ ] Bind design tokens to remaining Figma screens (compliance frames use DS components; variable binding pending)
- [ ] **Approve and modify existing screens** — see [figma-compliance-screen-gap-audit.md](compliance/figma-compliance-screen-gap-audit.md#existing-screens-pending-approval)
- [x] Native session flow in `frontend/src/app/` — `expo-location`/`expo-camera` wired; GPS route + distance live in Expo Go
- [ ] `backend/payments/` — shop checkout and donation processing
- [ ] Replace remaining HTML prototype screens per [manifest.yaml](../frontend/design/figma/manifest.yaml) and [figma-to-native-handoff.md](frontend/specs/figma-to-native-handoff.md)
- [ ] EAS dev-client builds (deferred — Expo Go sufficient for session test phase; `app.json` plugins already configured)

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
