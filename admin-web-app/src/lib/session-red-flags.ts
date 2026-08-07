/**
 * Implements `docs/agents/session-abuse-checklist.md`'s "Quick red-flag bundle" as a
 * pure function over data already surfaced in the session drawer. Advisory only — the
 * checklist explicitly warns "One red flag ≠ decline," so this returns a list of
 * triggered reasons for a tooltip, never a single verdict.
 */
import type { PlausibilitySignal, SessionPhotoPin } from '@/lib/session-evidence';
import type { VolunteerActivityPattern } from '@/lib/live-data';

export type RedFlag = {
  key: string;
  label: string;
};

/** Off-route pins beyond this distance are treated as a mismatch worth flagging. */
const OFF_ROUTE_METERS_THRESHOLD = 150;

/** Sessions this long with fewer than 2 checkpoint photos look thin on evidence. */
const LOW_PHOTO_COUNT_DURATION_SECONDS = 1800;
const LOW_PHOTO_COUNT_THRESHOLD = 2;

export function computeRedFlags(params: {
  durationSeconds: number | null;
  checkpointCount: number;
  photoPins: Pick<SessionPhotoPin, 'fromGps' | 'offRouteMeters'>[];
  plausibilitySignal: PlausibilitySignal | null;
  volunteerPattern: VolunteerActivityPattern | null;
}): RedFlag[] {
  const { durationSeconds, checkpointCount, photoPins, plausibilitySignal, volunteerPattern } = params;
  const flags: RedFlag[] = [];

  if (
    durationSeconds != null &&
    durationSeconds >= LOW_PHOTO_COUNT_DURATION_SECONDS &&
    checkpointCount < LOW_PHOTO_COUNT_THRESHOLD
  ) {
    flags.push({
      key: 'low-photo-count',
      label: `${Math.round(durationSeconds / 60)} min session with only ${checkpointCount} checkpoint${checkpointCount === 1 ? '' : 's'}`,
    });
  }

  if (plausibilitySignal?.exceedsPlausibleSpeed) {
    flags.push({ key: 'exceeds-speed', label: 'Route implies faster-than-walking speed' });
  }
  if (plausibilitySignal?.tightLoop) {
    flags.push({ key: 'tight-loop', label: 'High distance claimed but route never leaves a small area' });
  }
  if (plausibilitySignal?.idleHighDuration) {
    flags.push({ key: 'idle-high-duration', label: 'Long duration with almost no movement' });
  }

  const offRoutePins = photoPins.filter((p) => p.fromGps && p.offRouteMeters > OFF_ROUTE_METERS_THRESHOLD);
  if (offRoutePins.length > 0) {
    flags.push({
      key: 'off-route-checkpoints',
      label: `${offRoutePins.length} checkpoint photo${offRoutePins.length === 1 ? '' : 's'} captured off the route`,
    });
  }

  if (volunteerPattern?.nearDeadlineVolumeSpike) {
    flags.push({ key: 'near-deadline-spike', label: 'Multiple sessions clustered near the court due date' });
  }

  if (volunteerPattern) {
    const { invalidSessionsLast30Days, deleteCount } = volunteerPattern;
    if (invalidSessionsLast30Days >= 2 || deleteCount >= 2) {
      flags.push({
        key: 'invalid-or-delete-pattern',
        label: `${invalidSessionsLast30Days} invalid session${invalidSessionsLast30Days === 1 ? '' : 's'} (30d), ${deleteCount} deleted (all-time)`,
      });
    }
  }

  return flags;
}
