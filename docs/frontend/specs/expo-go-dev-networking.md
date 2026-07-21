# Spec: Expo Go dev server networking

**Date:** 2026-07-20  
**Status:** Implemented  
**Entrypoint:** [`frontend/scripts/start-expo-go.mjs`](../../../frontend/scripts/start-expo-go.mjs)

## Summary

Physical-device testing with **Expo Go** needs different Metro host modes depending on how the Mac and phone are connected. The repo wraps `expo start --go` to pick **LAN** or **tunnel** automatically and documents overrides for Wi‑Fi, iPhone Personal Hotspot, and phone-on-cellular.

## Commands

| Command | Host mode | When to use |
|---------|-----------|-------------|
| `npm start` (repo root) | **Tunnel** (default) | Physical device on Wi‑Fi, hotspot, or cellular |
| `npm run start:lan` | LAN | Mac and phone on the **same Wi‑Fi** only |
| `npm run start:device` | Tunnel | Phone on **LTE/5G** while Mac is on Wi‑Fi, or any cross-network case |
| `npm run start:tunnel` | Tunnel | Same as `start:device`; strict firewalls |

Tunnel requires **internet on the Mac**. LAN requires the phone to reach the Mac’s LAN IP (same Wi‑Fi subnet).

## Network matrix

| Scenario | Mac | Phone | Command | Expected URL |
|----------|-----|-------|---------|--------------|
| Home Wi‑Fi | Wi‑Fi | Same Wi‑Fi | `npm run start:lan` (fast) or `npm start` (tunnel) | `exp://192.168.x.x:8081` or tunnel host |
| iPhone hotspot (same phone) | Hotspot client | Hotspot host | `npm start` (tunnel) | `exp://….exp.direct` |
| Phone on cellular | Wi‑Fi | LTE/5G | `npm start` (tunnel) | `exp://….exp.direct` |
| Simulator | — | iOS Simulator on Mac | Press `i` in Metro, or `npm run start:local` | `localhost` |

## Implementation notes

- **Default host mode:** **`tunnel`** unless `EXPO_GO_LAN=1` / `npm run start:lan`. Set `EXPO_GO_AUTO=lan` to restore “LAN on non-hotspot Mac” auto behavior.
- **Metro:** [`metro.config.js`](../../../frontend/metro.config.js) sets `server.host = '0.0.0.0'` so LAN mode is reachable from other devices on the network.
- **CI mode:** The start script **unsets `CI`** in the child process (unless `EXPO_GO_CI=1`) so Metro is not stuck in “CI mode” with reloads disabled.
- **Tunnel preflight:** Verifies `@expo/ngrok-bin-*` exists before starting tunnel.

## Troubleshooting

### “The request timed out” (`exp://10.0.0.x:8081` or LAN IP)

You started in **LAN** mode but the phone cannot reach the Mac (cellular, guest Wi‑Fi, AP isolation). Stop Metro and run **`npm start`** (tunnel) or put the phone on the same Wi‑Fi and use **`npm run start:lan`**.

### “Tunnel connection has been closed”

Intermittent ngrok/Expo tunnel. Stop Metro and run `npm start` again. If it keeps failing on hotspot, use the **USB fallback** below.

### “Metro is running in CI mode”

Your shell may export `CI=true`. The start script clears it for Metro. To keep CI for Metro: `EXPO_GO_CI=1 npm start`.

### Phone on Wi‑Fi but QR still fails

- Confirm Mac firewall allows incoming connections for Node.
- Try `npm run start:device` (tunnel).
- Confirm QR shows your Mac’s Wi‑Fi IP (`192.168…`), not `127.0.0.1`.

### Expo SDK version warning

With Metro **stopped**: `cd frontend && npx expo install expo@~54.0.36`.

## USB fallback (tunnel unstable)

When tunnel drops repeatedly on hotspot or cellular:

1. Connect iPhone to Mac with **USB**.
2. Install port forwarding: `brew install libimobiledevice`, then in a second terminal: `iproxy 8081 8081`.
3. In `frontend/`: `EXPO_GO_LAN=1 npx expo start --go --localhost`.
4. In Expo Go, open the dev server entry for localhost / manual URL if needed.

## Test plan

1. **Wi‑Fi:** Same network → `npm run start:lan` → scan QR → app loads; edit a file → fast refresh (no CI banner).
2. **Hotspot:** Mac on phone hotspot → `npm start` → tunnel URL → same phone loads.
3. **Cellular:** Phone on LTE, Mac on home Wi‑Fi → `npm run start:device` → phone loads (API calls need phone internet).

## References

- [session-tracking-expo-go.md](session-tracking-expo-go.md) — device testing for GPS/sessions
- [accounts-and-access.md](../../accounts-and-access.md) — EAS dev client (separate from Expo Go LAN/tunnel)
