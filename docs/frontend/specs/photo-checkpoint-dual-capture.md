# Spec: Photo checkpoint — dual / sequential capture

**Date:** 2026-07-18 (updated 2026-07-20)  
**Status:** Implemented (`expo-camera` sequential)  
**PRD:** §6.12 (photo checkpoint)  
**Route:** `/photo-capture` (`PhotoCaptureScreen`)  
**Related:** [session-tracking-expo-go.md](session-tracking-expo-go.md) AC-12, AC-36; [report](../../reports/2026-07-18-backend-and-dual-camera.md)

## Summary

Photo checkpoints use a BeReal-style **preview** (full-bleed progress + selfie PiP) before submit. Capture uses **`expo-camera` sequential** capture (front selfie → back progress) without remounting the camera between steps; simultaneous multi-cam remains disabled (Fabric/Nitro crash risk — see dual-camera report).

## User stories

- As a **volunteer**, I want to capture my selfie and cleanup area quickly, so that checkpoints are low-friction during an active session.
- As a **volunteer**, I want to review both photos before submitting, so that I can retake if something is wrong.
- As a **tester**, I want clear capture errors (not a stuck shutter), so that I can recover without force-quitting.

## Acceptance criteria

- [x] **AC-1:** `/photo-capture` uses **`expo-camera` `CameraView`** sequential capture (front then back) with mirrored front preview, selfie PiP on the back step, haptic shutter, and `onCameraReady` gating on the **first** (front) step only — do not reset ready when flipping `facing` (native does not re-fire `onCameraReady`).
- [x] **AC-2:** Shutter is disabled until `onCameraReady`; null URI / capture failures show Alert + inline error.
- [x] **AC-3:** Preview matches Figma `383:239`: full-bleed progress, selfie PiP, **Retake Photos** and **Submit**.
- [x] **AC-4:** **Retake** returns to live capture; **Submit** persists via `persistCheckpointPhotos`, calls `addPhotoCheckpoint`, navigates to `/photo-submitted`.
- [x] **AC-9:** **Session start** mode (`?mode=session-start`): after setup **Start Session**, volunteer must capture selfie + progress on `/photo-capture` before GPS/timer start; submit calls `startNewLiveSession` + first checkpoint then `/live-session`; cancel clears pending setup and returns to session setup
- [x] **AC-10:** **Session end** mode (`?mode=session-end`): **End Session** on live tracker opens dual capture; submit adds final checkpoint + `finalizeLiveSession` → `/submission-confirmation` (route preview + replay); cancel returns to `/live-session`
- [x] **AC-5:** **Cancel** / Go Back uses `dismissTo('/live-session')` for in-session checkpoints; session-start cancel returns to setup
- [x] **AC-6:** Historical VisionCamera `DualCapture` path is **not mounted**; simultaneous dual remains out of scope until native crash is fixed.
- [x] **AC-7:** Web shows “camera not available” guidance.
- [x] **AC-8:** Submitted photos appear on submission confirmation with real timestamps (see session-tracking AC-13).

## Out of scope

- Re-enabling simultaneous dual capture for App Store (blocked on VisionCamera / Fabric HybridObject serialization)
- Video / burst / flash customization beyond defaults
- Camera roll export before submit

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `expo-camera` | Live preview + `takePictureAsync` (Expo Go + dev client) |

## Notes

- Prefer sequential-first for production reliability; dual is a polish path once native crash is fixed.
- See progress Session 181 and the dual-camera report for the Fabric/Nitro root cause.
