import type { ImageSource } from 'expo-image';

import { getCachedCompletedSession } from '@/features/session-tracking/completedSessionCache';
import type { CompletedSessionSnapshot } from '@/features/session-tracking/liveSessionStore';
import {
  formatSessionDateLabel,
  formatSessionTimeRange,
  resolveSessionDurationSeconds,
} from '@/features/session-tracking/utils/sessionFormat';
import type { RouteCoordinate } from '@/features/session-tracking/utils/geo';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '@/features/session-tracking/utils/mapStyles';

import type { SessionApprovalStatus } from './sessions';

/**
 * Photo evidence entry shape for session detail.
 */
export type SessionEvidencePhoto = {
  id: string;
  source: ImageSource | { uri: string };
  caption?: string;
};

export type SessionDetailData = {
  id: string;
  title: string;
  status: SessionApprovalStatus;
  dateTimeLabel: string;
  locationAddress: string;
  hoursLabel: string;
  milesLabel: string;
  photosCountLabel: string;
  routeCoordinates: RouteCoordinate[];
  evidencePhotos: SessionEvidencePhoto[];
  /** Basemap layer the user had selected when the session ended. */
  mapLayer: MapLayerType;
};

/** Figma `session_detail` (node `515:1848`) — default Downtown Riverfront mock. */
const DEFAULT_DETAIL: SessionDetailData = {
  id: 'downtown-riverfront',
  title: 'Downtown Riverfront Clean-up',
  status: 'approved',
  dateTimeLabel: 'July 15 at 5PM',
  locationAddress: '600 E Algonquin Rd, Des Plaines, IL, 60018',
  hoursLabel: '2.5',
  milesLabel: '3.4',
  photosCountLabel: '4',
  routeCoordinates: [],
  evidencePhotos: MOCK_EVIDENCE_PHOTOS,
  mapLayer: DEFAULT_MAP_LAYER,
};
const EMPTY_LOCATION = '—';

export function emptySessionDetail(id = ''): SessionDetailData {
  return {
    id,
    title: 'Session',
    status: 'pending',
    dateTimeLabel: '—',
    locationAddress: EMPTY_LOCATION,
    hoursLabel: '0.0',
    milesLabel: '0.0',
    photosCountLabel: '0',
    routeCoordinates: [],
    evidencePhotos: [],
  };
}

function statusLabel(status: SessionApprovalStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'pending':
      return 'Pending';
    case 'declined':
      return 'Declined';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function sessionStatusBadgeLabel(status: SessionApprovalStatus): string {
  return statusLabel(status);
}

export function detailFromCompletedSnapshot(
  snapshot: CompletedSessionSnapshot,
  id: string,
): SessionDetailData {
  const durationSeconds = resolveSessionDurationSeconds({
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    elapsedSeconds: snapshot.elapsedSeconds,
  });

  const evidencePhotos: SessionEvidencePhoto[] = snapshot.submittedCheckpoints.map(
    (checkpoint, index) => ({
      id: checkpoint.id,
      source: { uri: checkpoint.selfieUri },
      caption: `Checkpoint photo ${index + 1} of ${snapshot.submittedCheckpoints.length}`,
    }),
  );

  return {
    id,
    title: snapshot.setup.activity,
    status: 'pending',
    dateTimeLabel: `${formatSessionDateLabel(snapshot.startedAt)} · ${formatSessionTimeRange(snapshot.startedAt, snapshot.endedAt)}`,
    locationAddress: snapshot.setup.description?.trim() || EMPTY_LOCATION,
    hoursLabel: (durationSeconds / 3600).toFixed(1),
    milesLabel: snapshot.distanceMiles.toFixed(1),
    photosCountLabel: String(snapshot.submittedCheckpoints.length),
    routeCoordinates: snapshot.routeCoordinates,
    evidencePhotos,
    mapLayer: snapshot.mapLayer ?? DEFAULT_MAP_LAYER,
  };
}

/** Resolves session detail from the local completed-session cache only. */
export function getSessionDetail(id?: string): SessionDetailData {
  if (id) {
    const cached = getCachedCompletedSession(id);
    if (cached) {
      return detailFromCompletedSnapshot(cached, id);
    }
  }

  if (!id) {
    return DEFAULT_DETAIL;
  }

  const listItem = mockSessionsList.find((session) => session.id === id);
  if (!listItem) {
    return DEFAULT_DETAIL;
  }

  const override = DETAIL_OVERRIDES[id] ?? {};
  return {
    id: listItem.id,
    title: listItem.title,
    status: listItem.status,
    dateTimeLabel: `${listItem.dateLabel} · ${listItem.timeLabel}`,
    locationAddress: override.locationAddress ?? DEFAULT_DETAIL.locationAddress,
    hoursLabel: override.hoursLabel ?? DEFAULT_DETAIL.hoursLabel,
    milesLabel: override.milesLabel ?? DEFAULT_DETAIL.milesLabel,
    photosCountLabel: override.photosCountLabel ?? DEFAULT_DETAIL.photosCountLabel,
    routeCoordinates: [],
    evidencePhotos: MOCK_EVIDENCE_PHOTOS,
    mapLayer: DEFAULT_MAP_LAYER,
  };
  return emptySessionDetail(id);
}
