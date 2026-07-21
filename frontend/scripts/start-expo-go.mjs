#!/usr/bin/env node
/**
 * Starts Expo Go with LAN or tunnel based on network context.
 *
 * Default: **tunnel** (Wi‑Fi, iPhone hotspot, phone on cellular).
 * LAN (faster, same Wi‑Fi only): `npm run start:lan` or `EXPO_GO_LAN=1`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

/** @returns {'lan' | 'tunnel'} */
function resolveHostMode(argv) {
  if (process.env.EXPO_GO_LAN === '1') {
    return 'lan';
  }
  if (process.env.EXPO_GO_TUNNEL === '1') {
    return 'tunnel';
  }
  if (argv.includes('--lan')) {
    return 'lan';
  }
  if (argv.includes('--tunnel')) {
    return 'tunnel';
  }
  if (isPersonalHotspotActive()) {
    return 'tunnel';
  }
  if (process.env.EXPO_GO_AUTO === 'lan') {
    return 'lan';
  }
  return 'tunnel';
}

function isPersonalHotspotActive() {
  try {
    const interfaces = os.networkInterfaces();
    for (const entries of Object.values(interfaces)) {
      if (!entries) {
        continue;
      }
      for (const entry of entries) {
        if (entry.family !== 'IPv4' || entry.internal) {
          continue;
        }
        if (entry.address.startsWith('172.20.10.')) {
          return true;
        }
      }
    }
  } catch (error) {
    console.warn('[expo] Could not read network interfaces:', error);
  }
  return false;
}

/** First non-internal IPv4 for LAN sanity checks in the startup banner. */
function getPrimaryLanIPv4() {
  try {
    const interfaces = os.networkInterfaces();
    for (const entries of Object.values(interfaces)) {
      if (!entries) {
        continue;
      }
      for (const entry of entries) {
        if (entry.family !== 'IPv4' || entry.internal) {
          continue;
        }
        if (entry.address.startsWith('127.')) {
          continue;
        }
        return entry.address;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function ngrokPackageName() {
  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'ngrok-bin-darwin-arm64' : 'ngrok-bin-darwin-x64';
  }
  if (process.platform === 'linux') {
    return process.arch === 'arm64' ? 'ngrok-bin-linux-arm64' : 'ngrok-bin-linux-x64';
  }
  if (process.platform === 'win32') {
    return 'ngrok-bin-windows-x64';
  }
  return null;
}

function assertNgrokBinary() {
  const pkg = ngrokPackageName();
  if (!pkg) {
    console.warn('[expo] Unknown platform for ngrok preflight — continuing.');
    return;
  }

  const ngrokPath = path.join(frontendRoot, 'node_modules', '@expo', pkg, 'ngrok');
  if (!fs.existsSync(ngrokPath)) {
    console.error(`[expo] Tunnel requires @expo/${pkg} but ngrok was not found.`);
    console.error('[expo] Run: cd frontend && npm install');
    process.exit(1);
  }

  try {
    fs.accessSync(ngrokPath, fs.constants.X_OK);
  } catch {
    console.error(`[expo] ngrok binary is not executable: ${ngrokPath}`);
    process.exit(1);
  }
}

function printStartupBanner(hostMode) {
  const lanIp = getPrimaryLanIPv4();
  console.log(`[expo] Dev server host mode: ${hostMode.toUpperCase()}`);
  if (lanIp) {
    console.log(`[expo] Mac IPv4: ${lanIp}`);
  }
  if (hostMode === 'lan') {
    console.log('[expo] LAN only — phone must be on the same Wi‑Fi. Otherwise use: npm start (tunnel)');
  } else {
    console.log('[expo] Tunnel — works when phone is on Wi‑Fi, hotspot, or cellular (Mac needs internet).');
    console.log('[expo] Same Wi‑Fi and want faster loads? Use: npm run start:lan');
  }
  console.log('[expo] If Expo asks to log in, choose Proceed anonymously.');
  console.log('[expo] Docs: docs/frontend/specs/expo-go-dev-networking.md');
}

function buildChildEnv() {
  const childEnv = { ...process.env, EXPO_NO_TELEMETRY: '1' };
  if (process.env.EXPO_GO_CI !== '1') {
    delete childEnv.CI;
  }
  return childEnv;
}

const passthrough = process.argv.slice(2).filter((arg) => arg !== '--lan' && arg !== '--tunnel');
const hostMode = resolveHostMode(process.argv.slice(2));

if (hostMode === 'tunnel') {
  assertNgrokBinary();
}

printStartupBanner(hostMode);

const expoArgs = ['expo', 'start', '--go', `--${hostMode}`, ...passthrough];

const child = spawn('npx', expoArgs, {
  cwd: frontendRoot,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  env: buildChildEnv(),
});

/** Select "Proceed anonymously" when Expo shows the login prompt (second menu item). */
function sendProceedAnonymously() {
  if (child.stdin?.writable) {
    child.stdin.write('\u001B[B\n');
  }
}

child.on('spawn', () => {
  sendProceedAnonymously();
  setImmediate(sendProceedAnonymously);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
