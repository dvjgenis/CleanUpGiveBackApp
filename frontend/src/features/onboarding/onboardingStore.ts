import { useSyncExternalStore } from 'react';

/** In-memory onboarding gate + profile fields for the prototype (no persistence yet). */
let onboardingComplete = false;
let preferredName = '';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function markOnboardingComplete(): void {
  onboardingComplete = true;
}

export function isOnboardingComplete(): boolean {
  return onboardingComplete;
}

/** Saves the preferred/display name from the account-phone details step. */
export function setPreferredName(name: string): void {
  preferredName = name.trim();
  notify();
}

export function getPreferredName(): string {
  return preferredName;
}

export function subscribePreferredName(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePreferredName(): string {
  return useSyncExternalStore(subscribePreferredName, getPreferredName, getPreferredName);
}
