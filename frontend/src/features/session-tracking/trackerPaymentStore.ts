import { useSyncExternalStore } from 'react';

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

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTrackerHasPaid(): boolean {
  return useSyncExternalStore(subscribe, getTrackerHasPaid, getTrackerHasPaid);
}
