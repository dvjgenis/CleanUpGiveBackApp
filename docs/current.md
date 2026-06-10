# Current state

What runs in the repo today (updated with monorepo layout).

## Runnable today

- **Expo app** in `frontend/` — Expo SDK 54, React Native 0.81, Expo Router
- **HTML prototype mode** — `frontend/src/app/prototype/[screen].tsx` renders Stitch HTML screens in a WebView with JS navigation bridge
- **Entry flow** — `frontend/src/app/index.tsx` redirects into the prototype gallery

## Not implemented yet

- Backend services under `backend/` (maps, payments, session tracking APIs)
- Native location, camera, and live map tracking (UI exists in Stitch HTML only)
- Production auth, payments, or persistence

## How to run

```bash
npm install --prefix frontend
npm start          # from repo root
# or: cd frontend && npx expo start
```

## Key paths

| Area | Path |
|------|------|
| App routes | `frontend/src/app/` |
| Bundled HTML screens | `frontend/assets/stitch/` |
| Design exports | `frontend/design/` |
| TS prototype (optional) | `frontend/prototype/` |
