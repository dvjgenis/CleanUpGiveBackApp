import type { LiveSessionSetup } from './liveSessionStore';

let pendingSetup: LiveSessionSetup | null = null;

export function setPendingSessionSetup(setup: LiveSessionSetup): void {
  pendingSetup = setup;
}

export function getPendingSessionSetup(): LiveSessionSetup | null {
  return pendingSetup;
}

export function consumePendingSessionSetup(): LiveSessionSetup | null {
  const setup = pendingSetup;
  pendingSetup = null;
  return setup;
}

export function clearPendingSessionSetup(): void {
  pendingSetup = null;
}
