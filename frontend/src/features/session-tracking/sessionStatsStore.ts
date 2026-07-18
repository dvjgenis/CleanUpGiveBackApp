import { useSyncExternalStore } from 'react';

import { listSessions } from '@/lib/sessionsApi';
import { isApiConfigured } from '@/lib/api';

import type { CompletedSessionSnapshot } from './liveSessionStore';
import {
  mergeSessionStats,
  sessionStatFromApi,
  sessionStatFromSnapshot,
  type SessionStatRecord,
} from './utils/homeDashboardStats';

let sessionStats: SessionStatRecord[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getSessionStats(): SessionStatRecord[] {
  return sessionStats;
}

export function subscribeSessionStats(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSessionStats() {
  return useSyncExternalStore(subscribeSessionStats, getSessionStats, getSessionStats);
}

export function recordSessionStatFromSnapshot(snapshot: CompletedSessionSnapshot) {
  sessionStats = mergeSessionStats(sessionStats, [sessionStatFromSnapshot(snapshot)]);
  notify();
}

export async function hydrateSessionStatsFromApi() {
  if (!isApiConfigured) {
    return;
  }

  try {
    const sessions = await listSessions();
    const fromApi = sessions
      .map(sessionStatFromApi)
      .filter((record): record is SessionStatRecord => record != null);
    sessionStats = mergeSessionStats(sessionStats, fromApi);
    notify();
  } catch (error) {
    console.warn('[sessions] hydrate stats failed:', error);
  }
}

export function resetSessionStats() {
  sessionStats = [];
  notify();
}
