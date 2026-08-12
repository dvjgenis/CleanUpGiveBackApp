# Spec: Free-hour tracker paywall

## Summary

Unpaid volunteers get **one free hour** of live tracking (`FREE_TRIAL_DURATION_SECONDS` = 3600). When elapsed time hits the limit, the live tracker fires sound + haptics **once**, then opens `/free-trial-done` (`FreeTrialModal`). **Continue** goes to tracker checkout; **Pay Later** ends the session as `under_review` and opens that session’s detail screen. Session detail exposes primary **Go Home** (and the back chevron also goes Home).

## User stories

- As an unpaid volunteer, I want a clear free-hour countdown on the live tracker, so I know when paywall access ends.
- As an unpaid volunteer, when my free hour ends, I want a one-shot alert and a paywall, so I can pay or stop without a looping alarm.
- As a volunteer who chooses **Pay Later**, I want the session finalized and shown on session detail, so I can review what was tracked and return Home.

## Acceptance criteria

- [x] **AC-1:** Live tracker shows **Free hour left** `MM:SS` under the timer while unpaid (`!trackerPaymentStore.hasPaid`).
- [x] **AC-2:** At `elapsedSeconds >= FREE_TRIAL_DURATION_SECONDS` (default **3600**), navigate once to `/free-trial-done` (`transparentModal`); do not re-push every tick (`freeTrialAlertedRef`).
- [x] **AC-3:** On expiry, call `alertPhotoCheckpointDue({ force: true })` **once** (same sound + haptics as photo checkpoints) — not `CheckpointAlertLoop`’s 5s repeat.
- [x] **AC-4:** **Continue** `replace`s → `/checkout?mode=tracker&returnTo=live-session` (must not `push` from the modal).
- [x] **AC-5:** **Pay Later** calls `finalizeLiveSession({ status: 'under_review' })`, then `dismissTo('/')` + `push('/session-detail?id=…')` (fallback `/sessions-list` if no snapshot id). Session is ended; no minimized pill.
- [x] **AC-6:** Session detail sticky footer: primary green **Go Home** above **Delete session** (when non-approved); back chevron also goes Home (`dismissTo('/')` / `replace('/')`).
- [x] **AC-7:** Paid / company-code upgrade (`markTrackerPaid`) removes the free-hour countdown and does not open the paywall.
- [x] **AC-8:** Dev QA may shorten the hour via `EXPO_PUBLIC_FREE_TRIAL_SECONDS` in `__DEV__` only; production default remains 1 hour.

## Out of scope

- Real Stripe charge for tracker access (checkout UI is mock until payments backend ships)
- Requiring final selfie/progress photos before Pay Later finalize
- Changing photo-checkpoint interval (independent of free-hour clock)

## Dependencies

- `frontend/src/features/session-tracking/trackerPaymentStore.ts`
- `frontend/src/app/free-trial-done.tsx` + `FreeTrialModal`
- `frontend/src/screens/LiveSessionScreen.tsx` (countdown + trigger + one-shot alert)
- `frontend/src/utils/photoCheckpointAlert.ts` (`force` bypasses throttle)
- `frontend/src/features/figma-screens/screens/SessionDetailScreen.tsx`
- Figma `free_trial_done` (`1141:2178`)

## Test plan

1. Unpaid account → start live session → confirm **Free hour left** counts down from ~1:00:00.
2. Dev only: set `EXPO_PUBLIC_FREE_TRIAL_SECONDS=10`, reload → at ~10s hear/feel alert once → paywall opens (does not loop).
3. **Continue** → checkout (full screen, not nested modal) → return path via `returnTo=live-session` after payment mock.
4. New unpaid session → expire → **Pay Later** → session detail for that session; no live pill; **Go Home** / back chevron → Home (not live tracker).
5. Company code / paid flag → no free-hour UI and no paywall at 3600s.
