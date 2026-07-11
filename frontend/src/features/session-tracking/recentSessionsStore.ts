import { useSyncExternalStore } from 'react';

import type { RecentSessionSummary } from '@/features/figma-screens/mocks/home.types';

import type { CompletedSessionSnapshot } from './liveSessionStore';
import {
  formatRecentSessionDateLabel,
  formatRecentSessionDurationLabel,
  formatRecentSessionTimeLabel,
} from './utils/sessionFormat';

const MAX_RECENT_SESSIONS = 10;

let recentSessions: RecentSessionSummary[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function toRecentSessionSummary(snapshot: CompletedSessionSnapshot): RecentSessionSummary {
  return {
    id: `session-${snapshot.endedAt}`,
    title: snapshot.setup.activity,
    dateLabel: formatRecentSessionDateLabel(snapshot.startedAt),
    timeLabel: formatRecentSessionTimeLabel(snapshot.startedAt, snapshot.endedAt),
    durationLabel: formatRecentSessionDurationLabel(snapshot.elapsedSeconds),
  };
}

/** Prepends a completed session for the Home dashboard recent-sessions list. */
export function recordCompletedSession(snapshot: CompletedSessionSnapshot) {
  const summary = toRecentSessionSummary(snapshot);
  recentSessions = [summary, ...recentSessions.filter((session) => session.id !== summary.id)].slice(
    0,
    MAX_RECENT_SESSIONS,
  );
  notify();
}

export function getRecentSessions(): RecentSessionSummary[] {
  return recentSessions;
}

export function subscribeRecentSessions(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecentSessions() {
  return useSyncExternalStore(subscribeRecentSessions, getRecentSessions, getRecentSessions);
}

/** Test/dev helper — clears in-memory recent sessions. */
export function resetRecentSessions() {
  recentSessions = [];
  notify();
}
