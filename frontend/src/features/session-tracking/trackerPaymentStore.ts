import { useSyncExternalStore } from 'react';

/**
 * One free hour of live tracking before the paywall (Figma `free_trial_done`).
 * In `__DEV__`, set `EXPO_PUBLIC_FREE_TRIAL_SECONDS` (e.g. `60`) to shorten QA.
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

/** Prototype flag — set after tracker one-time payment is submitted. */
let hasPaid = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getTrackerHasPaid(): boolean {
  return hasPaid;
}

export function markTrackerPaid(): void {
  if (hasPaid) return;
  hasPaid = true;
  notify();
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
