# Xcode Build Guide

How to build and run the app on a physical iOS device using Xcode.

---

## Prerequisites

- Mac with Xcode installed (16+)
- Apple ID (free — no paid developer account needed for device testing)
- iPhone plugged in via USB, trusted on Mac

---

## One-time setup

### 1. Install dependencies and generate native folders

```bash
cd frontend
npx expo install react-native-vision-camera expo-build-properties
npx expo prebuild --clean
```

`prebuild --clean` generates `ios/` and `android/` and runs `pod install` automatically.
If pod install fails separately, run:

```bash
cd ios && pod install --repo-update && cd ..
```

### 2. Add your Apple ID to Xcode

1. Open **Xcode → Settings → Accounts**
2. Click **+** → **Apple ID** → sign in
3. Click **Manage Certificates → + → Apple Development**

### 3. Configure signing

```bash
open ios/nonprofitmobileapp.xcworkspace
```

1. Click **nonprofitmobileapp** in the left sidebar
2. Select the **nonprofitmobileapp** target
3. Go to **Signing & Capabilities**
4. Check **Automatically manage signing**
5. Set **Team** to your personal team (`Your Name (Personal Team)`)

> **Note:** Personal teams do not support Push Notifications. The entitlement
> has been removed from `ios/nonprofitmobileapp/nonprofitmobileapp.entitlements`.

---

## Building and running

1. Select your iPhone from the device picker at the top of Xcode
2. Press **⌘R** — Xcode builds and installs the app on your device
3. First build: ~5 min. Subsequent builds: ~30–60 sec

---

## After pulling new changes

If `app.json`, `package.json`, or any native module changes, regenerate native folders:

```bash
cd frontend
npx expo prebuild --clean
open ios/nonprofitmobileapp.xcworkspace
```

Then rebuild in Xcode (⌘R).

If only JS/TS files changed, just rebuild in Xcode — no prebuild needed.

---

## Common errors

| Error | Fix |
|---|---|
| `No signing certificates` | Add Apple ID in Xcode Settings → Accounts → Manage Certificates → + → Apple Development |
| `No profiles for bundle ID` | Bundle ID must not start with `com.anonymous`. Current: `com.shivpat.cleanupgiveback` |
| `Push Notifications not supported` | Remove `aps-environment` from `.entitlements` (already done) |
| `xcworkspace not found` | Run `npx expo prebuild --clean` then `cd ios && pod install` |
| `ReactNativeDependencies not found` | Run `pod install --repo-update` inside `ios/` |
| `devicectl JSON version` warning | Build directly from Xcode (⌘R) instead of `npx expo run:ios` |

---

## Bundle ID

`com.shivpat.cleanupgiveback` — set in `frontend/app.json`.

---

## TestFlight (requires paid $99/yr Apple Developer account)

1. Set device to **Any iOS Device (arm64)** in Xcode
2. **Product → Archive**
3. In Organizer: **Distribute App → TestFlight & App Store → Upload**
4. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → TestFlight → add testers by email

Or via EAS:
```bash
eas build --profile production --platform ios
eas submit --platform ios
```
