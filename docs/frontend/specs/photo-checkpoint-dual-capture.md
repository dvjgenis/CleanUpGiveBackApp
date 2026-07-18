# Spec: Photo checkpoint — dual / sequential capture

**Date:** 2026-07-18  
**Status:** Implemented (sequential default)  
**PRD:** §6.12 (photo checkpoint)  
**Route:** `/photo-capture` (`PhotoCaptureScreen`)  
**Related:** [session-tracking-expo-go.md](session-tracking-expo-go.md) AC-12, AC-36; [report](../../reports/2026-07-18-backend-and-dual-camera.md)

## Summary

Photo checkpoints use a BeReal-style **preview** (full-bleed progress + selfie PiP) before submit. Capture currently defaults to **VisionCamera sequential** (front selfie → back progress) because simultaneous multi-cam crashes on Fabric/Nitro. A `DualCapture` path remains in code (with mount-error / 8s readiness timeout / capture-failure → sequential fallback) but is **not mounted** until that native issue is fixed.

## User stories

- As a **volunteer**, I want to capture my selfie and cleanup area quickly, so that checkpoints are low-friction during an active session.
- As a **volunteer**, I want to review both photos before submitting, so that I can retake if something is wrong.
- As a **tester**, I want clear capture errors (not a stuck shutter), so that I can recover without force-quitting.

## Acceptance criteria

- [x] **AC-1:** `/photo-capture` uses VisionCamera **SequentialCapture** (front then back) by default.
- [x] **AC-2:** Shutter is disabled until `onStarted` / `onPreviewStarted`; null URI / capture failures show Alert + inline error.
- [x] **AC-3:** Preview matches Figma `383:239`: full-bleed progress, selfie PiP, **Retake Photos** and **Submit**.
- [x] **AC-4:** **Retake** returns to live capture; **Submit** persists via `persistCheckpointPhotos`, calls `addPhotoCheckpoint`, navigates to `/photo-submitted`.
- [x] **AC-5:** **Cancel** / Go Back uses `dismissTo('/live-session')`.
- [x] **AC-6:** `DualCapture` (when re-enabled) falls back to sequential on mount error, 8s readiness timeout, or capture failure.
- [x] **AC-7:** Web shows “camera not available” guidance.
- [x] **AC-8:** Submitted photos appear on submission confirmation with real timestamps (see session-tracking AC-13).

## Out of scope

- Re-enabling simultaneous dual capture for App Store (blocked on VisionCamera / Fabric HybridObject serialization)
- Video / burst / flash customization beyond defaults
- Camera roll export before submit

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `react-native-vision-camera` ^5 | Preview + `capturePhotoToFile` |
| EAS development build | Native camera modules (not fully available in Expo Go) |

## Notes

- Prefer sequential-first for production reliability; dual is a polish path once native crash is fixed.
- See progress Session 181 and the dual-camera report for the Fabric/Nitro root cause.
