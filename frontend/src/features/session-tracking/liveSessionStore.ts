import * as Location from 'expo-location';
import { useSyncExternalStore } from 'react';

import { recordCompletedSession } from './recentSessionsStore';
import {
  DEFAULT_MAP_CENTER,
  haversineMiles,
  MIN_ROUTE_SAMPLE_METERS,
  milesToMeters,
  toRouteCoordinate,
  type RouteCoordinate,
} from './utils/geo';

export const PHOTO_CHECKPOINT_INTERVAL_SECONDS = 30 * 60;

export type LiveSessionSetup = {
  activity: string;
  date: Date;
  courtOrdered: boolean;
  description: string;
};

export type PhotoCheckpointSubmission = {
  id: string;
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
  /** True when submitted before the 30-minute checkpoint countdown reached zero. */
  submittedEarly: boolean;
};

export type CompletedSessionSnapshot = {
  setup: LiveSessionSetup;
  startedAt: number;
  endedAt: number;
  elapsedSeconds: number;
  distanceMiles: number;
  routeCoordinates: RouteCoordinate[];
  submittedCheckpoints: PhotoCheckpointSubmission[];
};

type LiveSessionState = {
  isActive: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  checkpointSecondsRemaining: number;
  distanceMiles: number;
  setup: LiveSessionSetup | null;
  routeCoordinates: RouteCoordinate[];
  currentCoordinate: RouteCoordinate | null;
  mapRecenterToken: number;
  submittedCheckpoints: PhotoCheckpointSubmission[];
};

let state: LiveSessionState = {
  isActive: false,
  startedAt: null,
  elapsedSeconds: 0,
  checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
  distanceMiles: 0,
  setup: null,
  routeCoordinates: [],
  currentCoordinate: null,
  mapRecenterToken: 0,
  submittedCheckpoints: [],
};

let completedSessionSnapshot: CompletedSessionSnapshot | null = null;

let tickInterval: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<LiveSessionState>) {
  state = { ...state, ...patch };
  notify();
}

function startTicking() {
  if (tickInterval) {
    return;
  }

  tickInterval = setInterval(() => {
    if (!state.isActive) {
      return;
    }

    setState({
      elapsedSeconds: state.elapsedSeconds + 1,
      checkpointSecondsRemaining: Math.max(0, state.checkpointSecondsRemaining - 1),
    });
  }, 1000);
}

function stopTicking() {
  if (!tickInterval) {
    return;
  }

  clearInterval(tickInterval);
  tickInterval = null;
}

function recordLocationSample(latitude: number, longitude: number) {
  if (!state.isActive) {
    return;
  }

  const nextCoordinate = toRouteCoordinate(longitude, latitude);
  const previousCoordinate = state.currentCoordinate;

  if (!previousCoordinate) {
    setState({
      currentCoordinate: nextCoordinate,
      routeCoordinates: [nextCoordinate],
    });
    return;
  }

  const deltaMiles = haversineMiles(
    previousCoordinate[1],
    previousCoordinate[0],
    latitude,
    longitude,
  );

  if (milesToMeters(deltaMiles) < MIN_ROUTE_SAMPLE_METERS) {
    setState({ currentCoordinate: nextCoordinate });
    return;
  }

  setState({
    currentCoordinate: nextCoordinate,
    routeCoordinates: [...state.routeCoordinates, nextCoordinate],
    distanceMiles: state.distanceMiles + deltaMiles,
  });
}

function stopLocationWatching() {
  locationSubscription?.remove();
  locationSubscription = null;
}

async function startLocationWatching() {
  stopLocationWatching();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    recordLocationSample(position.coords.latitude, position.coords.longitude);
  } catch {
    // Continue with watch subscription even if the initial fix fails.
  }

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 3000,
      distanceInterval: MIN_ROUTE_SAMPLE_METERS,
    },
    (position) => {
      recordLocationSample(position.coords.latitude, position.coords.longitude);
    },
  );
}

/** Re-request location updates if the session is active but watching stopped (e.g. permission retry). */
export async function ensureLocationWatching() {
  if (!state.isActive || locationSubscription) {
    return;
  }

  await startLocationWatching();
}

/** Starts a fresh live session: elapsed at 0, checkpoint countdown at 30:00. */
export function startNewLiveSession(setup: LiveSessionSetup) {
  stopTicking();
  stopLocationWatching();
  completedSessionSnapshot = null;
  state = {
    isActive: true,
    startedAt: Date.now(),
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    distanceMiles: 0,
    setup,
    routeCoordinates: [],
    currentCoordinate: null,
    mapRecenterToken: 0,
    submittedCheckpoints: [],
  };
  notify();
  startTicking();
  void startLocationWatching();
}

/** Records a submitted selfie + progress photo pair for the session detail screen. */
export function addPhotoCheckpoint(submission: {
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
}): boolean {
  const nextIndex = state.submittedCheckpoints.length;
  const submittedEarly = state.checkpointSecondsRemaining > 0;

  setState({
    submittedCheckpoints: [
      ...state.submittedCheckpoints,
      {
        id: `checkpoint-${nextIndex}-${submission.capturedAt}`,
        submittedEarly,
        ...submission,
      },
    ],
  });

  return true;
}

/** Ensures the 1s session tick runs while a live session is active (e.g. after fast refresh). */
export function ensureLiveSessionTicking() {
  if (state.isActive) {
    startTicking();
  }
}

/** Resets only the checkpoint countdown after a photo is submitted. */
export function resetCheckpointCountdown() {
  if (!state.isActive) {
    return;
  }

  setState({ checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS });
  startTicking();
}

export function finalizeLiveSession() {
  if (!state.setup) {
    endLiveSession();
    return;
  }

  const endedAt = Date.now();
  completedSessionSnapshot = {
    setup: state.setup,
    startedAt: state.startedAt ?? endedAt,
    endedAt,
    elapsedSeconds: state.elapsedSeconds,
    distanceMiles: state.distanceMiles,
    routeCoordinates: [...state.routeCoordinates],
    submittedCheckpoints: [...state.submittedCheckpoints],
  };
  recordCompletedSession(completedSessionSnapshot);
  endLiveSession();
}

export function getCompletedSessionSnapshot() {
  return completedSessionSnapshot;
}

export function endLiveSession() {
  stopTicking();
  stopLocationWatching();
  state = {
    isActive: false,
    startedAt: null,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    distanceMiles: 0,
    setup: null,
    routeCoordinates: [],
    currentCoordinate: null,
    mapRecenterToken: 0,
    submittedCheckpoints: [],
  };
  notify();
}

export function requestLiveSessionMapRecenter() {
  if (!state.currentCoordinate) {
    void ensureLocationWatching();
    return;
  }

  setState({ mapRecenterToken: state.mapRecenterToken + 1 });
}

export function getLiveSessionState() {
  return state;
}

export function subscribeLiveSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLiveSession() {
  return useSyncExternalStore(subscribeLiveSession, getLiveSessionState, getLiveSessionState);
}

export function getCheckpointProgress(checkpointSecondsRemaining: number): number {
  const elapsedInInterval =
    PHOTO_CHECKPOINT_INTERVAL_SECONDS - Math.max(0, checkpointSecondsRemaining);
  return elapsedInInterval / PHOTO_CHECKPOINT_INTERVAL_SECONDS;
}

export function getLiveSessionMapCenter(): RouteCoordinate {
  return state.currentCoordinate ?? state.routeCoordinates[0] ?? DEFAULT_MAP_CENTER;
}

export function getLiveSessionMapZoom(hasFix: boolean): number {
  return hasFix ? 15 : 4;
}
