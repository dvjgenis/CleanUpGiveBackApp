import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * One free hour of live tracking before the paywall (Figma `free_trial_done`).
 * In `__DEV__`, set `EXPO_PUBLIC_FREE_TRIAL_SECONDS` (e.g. `60`) to shorten QA.
 * Company codes and checkout call `markTrackerPaid()` to remove the free-hour limit.
 */
export const FREE_TRIAL_DURATION_SECONDS = (() => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const fromEnv = Number(process.env.EXPO_PUBLIC_FREE_TRIAL_SECONDS);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
      return fromEnv;
    }
  }
  return 60 * 60;
})();

const STORAGE_KEY = '@cugb/trackerHasPaid';

/** Prototype flag — set after tracker payment or company code upgrade. */
let hasPaid = false;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Load persisted paid flag once at app start. */
export async function hydrateTrackerPaymentStore(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === '1') {
      hasPaid = true;
      notify();
    }
  } catch {
    // Ignore storage failures; in-memory flag still works for the session.
  }
}

void hydrateTrackerPaymentStore();

export function getTrackerHasPaid(): boolean {
  return hasPaid;
}

export function markTrackerPaid(): void {
  if (hasPaid) return;
  hasPaid = true;
  notify();
  void AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
}

/** Seconds left in the free hour for an unpaid tracker session. */
export function getFreeTrialSecondsRemaining(elapsedSeconds: number): number {
  return Math.max(0, FREE_TRIAL_DURATION_SECONDS - elapsedSeconds);
}

/** True when unpaid session elapsed time has reached the free-hour limit. */
export function isFreeTrialExpired(elapsedSeconds: number): boolean {
  return elapsedSeconds >= FREE_TRIAL_DURATION_SECONDS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTrackerHasPaid(): boolean {
  return useSyncExternalStore(subscribe, getTrackerHasPaid, getTrackerHasPaid);
}

/** Valid company upgrade codes (10 digits). Demo allowlist. */
export const COMPANY_UPGRADE_CODES = new Set([
  '1234567890',
  '9876543210',
  '5555555555',
]);

export function isValidCompanyCode(code: string): boolean {
  return COMPANY_UPGRADE_CODES.has(code.trim());
}
