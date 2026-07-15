import type { CompletedSessionSnapshot } from './liveSessionStore';

const cache = new Map<string, CompletedSessionSnapshot>();

/** Stores completed session snapshots for session detail / list lookups. */
export function cacheCompletedSession(snapshot: CompletedSessionSnapshot) {
  const primaryId = snapshot.remoteSessionId ?? `session-${snapshot.endedAt}`;
  cache.set(primaryId, snapshot);
  cache.set(`session-${snapshot.endedAt}`, snapshot);
}

export function getCachedCompletedSession(id?: string): CompletedSessionSnapshot | null {
  if (!id) {
    return null;
  }

  return cache.get(id) ?? null;
}

/** Test/dev helper — clears cached completed sessions. */
export function resetCompletedSessionCache() {
  cache.clear();
}
