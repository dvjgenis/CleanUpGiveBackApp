# Agent workflow & project setup

## Core commands

* **Start development server:** `npx expo start` (Expo Go or simulators)
* **Run iOS simulator:** `npm run ios`
* **Run Android emulator:** `npm run android`
* **Run web:** `npm run web`
* **Testing:** `npm run test`
* **Linting:** `npm run lint`
* **Reset project:** `npm run reset-project`

## Repo paths

* **Root:** `CleanUpGiveBackApp/` — do not use nested `Clean-Up-Give-Back/` paths
* **Routing:** `app/` (Expo Router)
* **Shared UI:** `components/`
* **Docs:** `docs/` — see [README.md](./README.md)

## Backpressure

* Expo React Native only — no Next.js, Tailwind, or Playwright
* GPS only during active cleanup sessions — not continuous background tracking
* Secrets: `.env` (app keys) and `credentials.local.md` (org logins) — both gitignored; template: [credentials.local.template.md](../credentials.local.template.md). See [accounts-and-access.md](./accounts-and-access.md).
* **Verify before done:** `npx tsc --noEmit`; `npm run lint` / `npm test` when relevant
* **Living docs:** `.cursor/rules/docs-backpressure.mdc` after code changes

## Specs & plans

* Feature specs: [docs/specs/](./specs/)
* Tasks: [implementation-plan.md](./implementation-plan.md)
* ADRs: [adr/overview.md](./adr/overview.md)
