import type { ImpactStat, WeeklyHoursDatum } from '@/features/figma-screens/mocks/home.types';
import type { ApiSession } from '@/lib/sessionsApi';
import { mapApiStatusToApproval } from '@/lib/mapApiSessions';

import type { CompletedSessionSnapshot } from '../liveSessionStore';
import { resolveSessionDurationSeconds } from './sessionFormat';
import { addDays, startOfWeekMonday, toIsoDate } from '@/features/figma-screens/utils/weekCalendar';

const CHART_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type SessionStatRecord = {
  id: string;
  startedAtMs: number;
  durationSeconds: number;
  distanceMiles: number;
  photoCount: number;
  locationLabel: string;
  status: 'approved' | 'pending' | 'declined';
};

function emptyWeekChart(): WeeklyHoursDatum[] {
  return CHART_DAY_LABELS.map((day) => ({ day, value: 0 }));
}

function dayIndexMondayBased(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

function sessionDurationFromApi(session: ApiSession): number {
  if (session.durationSeconds != null) {
    return session.durationSeconds;
  }

  if (session.startedAt && session.endedAt) {
    return resolveSessionDurationSeconds({
      startedAt: new Date(session.startedAt).getTime(),
      endedAt: new Date(session.endedAt).getTime(),
    });
  }

  return 0;
}

export function sessionStatFromApi(session: ApiSession): SessionStatRecord | null {
  if (session.status === 'active' || !session.startedAt) {
    return null;
  }

  return {
    id: session.id,
    startedAtMs: new Date(session.startedAt).getTime(),
    durationSeconds: sessionDurationFromApi(session),
    distanceMiles: session.distanceMiles ?? 0,
    photoCount: session.photoCount ?? (session.checkpointCount ?? 0) * 2,
    locationLabel: session.description?.trim() || session.activity?.trim() || 'Unknown',
    status: mapApiStatusToApproval(session.status),
  };
}

export function sessionStatFromSnapshot(snapshot: CompletedSessionSnapshot): SessionStatRecord {
  const id = snapshot.remoteSessionId ?? `local-${snapshot.endedAt}`;
  const photoCount = snapshot.submittedCheckpoints.reduce(
    (count, checkpoint) => count + (checkpoint.selfieUri ? 1 : 0) + (checkpoint.progressUri ? 1 : 0),
    0,
  );

  return {
    id,
    startedAtMs: snapshot.startedAt,
    durationSeconds: snapshot.elapsedSeconds,
    distanceMiles: snapshot.distanceMiles,
    photoCount,
    locationLabel: snapshot.setup.description?.trim() || snapshot.setup.activity?.trim() || 'Unknown',
    status: 'pending',
  };
}

export function mergeSessionStats(
  existing: SessionStatRecord[],
  incoming: SessionStatRecord[],
): SessionStatRecord[] {
  const byId = new Map<string, SessionStatRecord>();
  for (const record of existing) {
    byId.set(record.id, record);
  }
  for (const record of incoming) {
    const existingRecord = byId.get(record.id);
    if (existingRecord) {
      byId.set(record.id, {
        ...record,
        photoCount: Math.max(existingRecord.photoCount, record.photoCount),
      });
      continue;
    }

    byId.set(record.id, record);
  }

  return [...byId.values()].sort((a, b) => b.startedAtMs - a.startedAtMs);
}

export function buildWeeklyHoursChart(
  stats: readonly SessionStatRecord[],
  weekStartIso: string,
): WeeklyHoursDatum[] {
  const chart = emptyWeekChart();
  const weekStart = startOfWeekMonday(new Date(`${weekStartIso}T12:00:00`));

  for (const stat of stats) {
    if (stat.status === 'declined') {
      continue;
    }

    const sessionDay = startOfWeekMonday(new Date(stat.startedAtMs));
    const sessionWeekIso = toIsoDate(sessionDay);
    if (sessionWeekIso !== weekStartIso) {
      continue;
    }

    const dayIndex = dayIndexMondayBased(new Date(stat.startedAtMs));
    const minutes = Math.round(stat.durationSeconds / 60);
    chart[dayIndex] = {
      day: chart[dayIndex].day,
      value: chart[dayIndex].value + minutes,
    };
  }

  return chart;
}

export function formatWeekServiceHoursTotal(
  stats: readonly SessionStatRecord[],
  weekStartIso: string,
): string {
  const chart = buildWeeklyHoursChart(stats, weekStartIso);
  const totalMinutes = chart.reduce((sum, day) => sum + day.value, 0);
  if (totalMinutes <= 0) {
    return '0.0 hrs';
  }

  return `${(totalMinutes / 60).toFixed(1)} hrs`;
}

export function computeWeeklyStreakHours(stats: readonly SessionStatRecord[]): number {
  const weekStartIso = toIsoDate(startOfWeekMonday(new Date()));
  const totalMinutes = buildWeeklyHoursChart(stats, weekStartIso).reduce(
    (sum, day) => sum + day.value,
    0,
  );
  return Math.round(totalMinutes / 60);
}

export function buildImpactStats(stats: readonly SessionStatRecord[]): ImpactStat[] {
  const completed = stats.filter((stat) => stat.status !== 'declined');
  const miles = completed.reduce((sum, stat) => sum + stat.distanceMiles, 0);
  const locations = new Set(completed.map((stat) => stat.locationLabel.toLowerCase())).size;
  const sessions = completed.length;
  const photos = completed.reduce((sum, stat) => sum + stat.photoCount, 0);

  return [
    { id: 'miles', value: miles.toFixed(1), label: 'MILES COVERED', icon: 'miles' },
    { id: 'locations', value: String(locations), label: 'LOCATIONS CLEANED', icon: 'locations' },
    { id: 'sessions', value: String(sessions), label: 'SESSIONS COMPLETED', icon: 'sessions' },
    { id: 'photos', value: String(photos), label: 'PHOTOS SUBMITTED', icon: 'photos' },
  ];
}

export function weekIsoForDate(date: Date): string {
  return toIsoDate(startOfWeekMonday(date));
}

export function isDateInWeekIso(dateMs: number, weekStartIso: string): boolean {
  const weekStart = startOfWeekMonday(new Date(`${weekStartIso}T12:00:00`));
  const weekEnd = addDays(weekStart, 6);
  const day = new Date(dateMs);
  return day >= weekStart && day <= weekEnd;
}
