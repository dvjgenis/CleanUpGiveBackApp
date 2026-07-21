import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSession } from '@/lib/sessionsApi';

import type { MapLayerType } from './utils/mapStyles';
import type { RouteCoordinate } from './utils/geo';
import type { RouteSample } from './utils/routeFiltering';

const STORAGE_KEY = '@cleanup/live-session-draft/v1';
const PERSIST_DEBOUNCE_MS = 2000;

export type DraftPhotoCheckpoint = {
  id: string;
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
  submittedEarly: boolean;
};

export type LiveSessionDraft = {
  version: 1;
  remoteSessionId: string | null;
  startedAt: number;
  checkpointWindowStartedAt: number;
  distanceMiles: number;
  setup: {
    activity: string;
    dateIso: string;
    courtOrdered: boolean;
    description: string;
  };
  routeCoordinates: RouteCoordinate[];
  routeSamples: RouteSample[];
  submittedCheckpoints: DraftPhotoCheckpoint[];
  mapLayer: MapLayerType;
  mapFollowEnabled: boolean;
  savedAt: number;
};

export type LiveSessionResumeOffer = {
  draft: LiveSessionDraft;
  elapsedLabel: string;
  checkpointCount: number;
};

type LiveSessionStateSnapshot = {
  isActive: boolean;
  remoteSessionId: string | null;
  startedAt: number | null;
  checkpointWindowStartedAt: number | null;
  distanceMiles: number;
  setup: {
    activity: string;
    date: Date;
    courtOrdered: boolean;
    description: string;
  } | null;
  routeCoordinates: RouteCoordinate[];
  routeSamples: RouteSample[];
  submittedCheckpoints: DraftPhotoCheckpoint[];
  mapLayer: MapLayerType;
  mapFollowEnabled: boolean;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function draftFromState(state: LiveSessionStateSnapshot): LiveSessionDraft | null {
  if (!state.isActive || state.startedAt == null || state.setup == null) {
    return null;
  }

  if (state.checkpointWindowStartedAt == null) {
    return null;
  }

  return {
    version: 1,
    remoteSessionId: state.remoteSessionId,
    startedAt: state.startedAt,
    checkpointWindowStartedAt: state.checkpointWindowStartedAt,
    distanceMiles: state.distanceMiles,
    setup: {
      activity: state.setup.activity,
      dateIso: state.setup.date.toISOString(),
      courtOrdered: state.setup.courtOrdered,
      description: state.setup.description,
    },
    routeCoordinates: state.routeCoordinates,
    routeSamples: state.routeSamples,
    submittedCheckpoints: state.submittedCheckpoints,
    mapLayer: state.mapLayer,
    mapFollowEnabled: state.mapFollowEnabled,
    savedAt: Date.now(),
  };
}

export function persistLiveSessionDraftDebounced(state: LiveSessionStateSnapshot) {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistLiveSessionDraftNow(state);
  }, PERSIST_DEBOUNCE_MS);
}

async function persistLiveSessionDraftNow(state: LiveSessionStateSnapshot) {
  const draft = draftFromState(state);
  if (!draft) {
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('[live-session] draft persist failed:', error);
  }
}

export async function clearLiveSessionDraft() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[live-session] draft clear failed:', error);
  }
}

export async function loadLiveSessionDraft(): Promise<LiveSessionDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LiveSessionDraft;
    if (parsed?.version !== 1 || parsed.startedAt == null || !parsed.setup?.dateIso) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function formatElapsedMinutes(startedAt: number): string {
  const minutes = Math.max(1, Math.floor((Date.now() - startedAt) / 60_000));
  return `${minutes} min`;
}

async function isDraftStillResumable(draft: LiveSessionDraft): Promise<boolean> {
  if (!draft.remoteSessionId) {
    return true;
  }

  try {
    const detail = await getSession(draft.remoteSessionId);
    if (!detail?.session) {
      return true;
    }

    return detail.session.status === 'active';
  } catch {
    return true;
  }
}

export async function resolveLiveSessionResumeOffer(): Promise<LiveSessionResumeOffer | null> {
  const draft = await loadLiveSessionDraft();
  if (!draft) {
    return null;
  }

  const resumable = await isDraftStillResumable(draft);
  if (!resumable) {
    await clearLiveSessionDraft();
    return null;
  }

  return {
    draft,
    elapsedLabel: formatElapsedMinutes(draft.startedAt),
    checkpointCount: draft.submittedCheckpoints.length,
  };
}

export function liveSessionSetupFromDraft(draft: LiveSessionDraft): {
  activity: string;
  date: Date;
  courtOrdered: boolean;
  description: string;
} {
  return {
    activity: draft.setup.activity,
    date: new Date(draft.setup.dateIso),
    courtOrdered: draft.setup.courtOrdered,
    description: draft.setup.description,
  };
}
