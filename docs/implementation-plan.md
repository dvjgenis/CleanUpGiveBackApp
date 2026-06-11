# Implementation plan

High-level milestones for Clean Up - Give Back.

## Done

- [x] Monorepo layout: `frontend/`, `backend/`, `docs/`
- [x] Expo Router app with WebView-based Stitch HTML prototype
- [x] Metro config for `.html` asset bundling
- [x] Navigation bridge between HTML screens (postMessage)

## Next

- [ ] Native session flow: location permissions, map tracker, photo checkpoints
- [ ] `backend/sessions/` — session lifecycle, evidence upload, activity log API
- [ ] `backend/maps/` — route tracking, geofencing, map tile/provider integration
- [ ] `backend/payments/` — shop checkout and donation processing
- [ ] Replace HTML prototype screens with React Native implementations per [frontend/screen-map.md](frontend/screen-map.md)
- [ ] EAS builds with location/camera `app.json` plugins

## References

- PRD layouts: [frontend/specs/](frontend/specs/)
- Backend domains: [backend/context/](backend/context/)
- ADR index: [adr/overview.md](adr/overview.md)
