import type { ImageSource } from 'expo-image';

import { getCachedCompletedSession } from '@/features/session-tracking/completedSessionCache';
import type { CompletedSessionSnapshot } from '@/features/session-tracking/liveSessionStore';
import {
  formatSessionDateLabel,
  formatSessionTimeRange,
  resolveSessionDurationSeconds,
} from '@/features/session-tracking/utils/sessionFormat';
import type { RouteCoordinate } from '@/features/session-tracking/utils/geo';

import { mockSessionsList, type SessionApprovalStatus } from './sessions';

/**
 * Photo evidence entry shape for session detail.
 * When live tracking logs checkpoint photos, map them into this format and
 * pass via `evidencePhotos`.
 */
export type SessionEvidencePhoto = {
  /** Stable key for list rendering. */
  id: string;
  /** Local file URI or bundled `require()` source. */
  source: ImageSource | { uri: string };
  /** Optional caption shown in the enlarge viewer. */
  caption?: string;
};

/** Figma `session_detail` photo stubs (node `555:2380` / `515:1848`). */
const MOCK_EVIDENCE_PHOTOS: SessionEvidencePhoto[] = [
  {
    id: 'photo-1',
    source: require('@/assets/images/screens/session-detail/photo-1.png'),
    caption: 'Photo Evidence 1 of 4',
  },
  {
    id: 'photo-2',
    source: require('@/assets/images/screens/session-detail/photo-2.png'),
    caption: 'Photo Evidence 2 of 4',
  },
  {
    id: 'photo-3',
    source: require('@/assets/images/screens/session-detail/photo-3.png'),
    caption: 'Photo Evidence 3 of 4',
  },
  {
    id: 'photo-4',
    source: require('@/assets/images/screens/session-detail/photo-4.png'),
    caption: 'Photo Evidence 4 of 4',
  },
];

export type SessionDetailData = {
  id: string;
  title: string;
  status: SessionApprovalStatus;
  dateTimeLabel: string;
  locationAddress: string;
  hoursLabel: string;
  milesLabel: string;
  photosCountLabel: string;
  /**
   * GPS walking path from the live session tracker.
   * Empty until a completed session snapshot is wired in — map shows placeholder.
   */
  routeCoordinates: RouteCoordinate[];
  /**
   * Checkpoint photo evidence. Photo Evidence card (Figma `555:2380`) renders
   * when non-empty — 72×72 thumbs, 12px gap.
   */
  evidencePhotos: SessionEvidencePhoto[];
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
};

const DETAIL_OVERRIDES: Partial<
  Record<
    string,
    Partial<Omit<SessionDetailData, 'id' | 'routeCoordinates' | 'evidencePhotos'>>
  >
> = {
  'lincoln-park': {
    locationAddress: '2045 N Lincoln Park West, Chicago, IL 60614',
    hoursLabel: '2.0',
    milesLabel: '1.8',
    photosCountLabel: '4',
  },
  'north-side': {
    locationAddress: '3200 N Broadway, Chicago, IL 60657',
    hoursLabel: '2.0',
    milesLabel: '2.1',
    photosCountLabel: '4',
  },
  'des-plaines-river': {
    locationAddress: 'Des Plaines River Trail, Des Plaines, IL',
    hoursLabel: '2.0',
    milesLabel: '3.2',
    photosCountLabel: '4',
  },
  'community-garden': {
    locationAddress: '1200 Community Garden Way, Des Plaines, IL',
    hoursLabel: '2.0',
    milesLabel: '0.6',
    photosCountLabel: '4',
  },
  'park-district-trees': {
    locationAddress: 'Park District Tree Nursery, Des Plaines, IL',
    hoursLabel: '2.0',
    milesLabel: '1.1',
    photosCountLabel: '4',
  },
  'west-loop': {
    locationAddress: 'West Loop, Chicago, IL 60607',
    hoursLabel: '2.0',
    milesLabel: '2.4',
    photosCountLabel: '4',
  },
  'south-side': {
    locationAddress: 'South Side Community Center, Chicago, IL',
    hoursLabel: '2.0',
    milesLabel: '1.5',
    photosCountLabel: '4',
  },
  'historic-site': {
    locationAddress: 'Des Plaines Historic Site, Des Plaines, IL',
    hoursLabel: '3.0',
    milesLabel: '1.2',
    photosCountLabel: '4',
  },
};

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

function detailFromCompletedSnapshot(
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
    locationAddress: DEFAULT_DETAIL.locationAddress,
    hoursLabel: (durationSeconds / 3600).toFixed(1),
    milesLabel: snapshot.distanceMiles.toFixed(1),
    photosCountLabel: String(snapshot.submittedCheckpoints.length),
    routeCoordinates: snapshot.routeCoordinates,
    evidencePhotos,
  };
}

/** Resolves session detail for a list row id, falling back to the Figma default mock. */
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
  };
}
