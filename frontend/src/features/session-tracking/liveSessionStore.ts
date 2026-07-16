import * as Location from 'expo-location';
import { useSyncExternalStore } from 'react';

import {
  addCheckpoint,
  createSession,
  finalizeSession,
} from '@/lib/sessionsApi';
import { uploadCheckpointPhotos } from '@/lib/uploadCheckpointPhotos';

import { recordCompletedSession } from './recentSessionsStore';
import { cacheCompletedSession } from './completedSessionCache';
import { DEFAULT_MAP_LAYER, type MapLayerType } from './utils/mapStyles';
import { computeSessionDurationSeconds } from './utils/sessionFormat';
import {
  DEFAULT_MAP_CENTER,
  haversineMiles,
  MIN_ROUTE_SAMPLE_METERS,
  toRouteCoordinate,
  type RouteCoordinate,
} from './utils/geo';
import {
  deltaMetersBetween,
  isAcceptableAccuracy,
  MAX_ACCEPTABLE_ACCURACY_METERS,
  resolveCompassHeading,
  resolveHeading,
  shouldAppendRoutePoint,
  smoothCoordinateEma,
  smoothHeadingEma,
} from './utils/routeFiltering';

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
  remoteSessionId: string | null;
  setup: LiveSessionSetup;
  startedAt: number;
  endedAt: number;
  elapsedSeconds: number;
  distanceMiles: number;
  routeCoordinates: RouteCoordinate[];
  submittedCheckpoints: PhotoCheckpointSubmission[];
  /** Basemap layer the user had selected when the session ended, so the
   * route replay (session detail, submission confirmation) opens on the
   * same layer instead of always resetting to the default. */
  mapLayer: MapLayerType;
};

type LiveSessionState = {
  isActive: boolean;
  remoteSessionId: string | null;
  startedAt: number | null;
  checkpointWindowStartedAt: number | null;
  elapsedSeconds: number;
  checkpointSecondsRemaining: number;
  distanceMiles: number;
  setup: LiveSessionSetup | null;
  routeCoordinates: RouteCoordinate[];
  currentCoordinate: RouteCoordinate | null;
  displayCoordinate: RouteCoordinate | null;
  currentHeading: number | null;
  mapRecenterToken: number;
  mapFollowEnabled: boolean;
  mapLayer: MapLayerType;
  submittedCheckpoints: PhotoCheckpointSubmission[];
};

let state: LiveSessionState = {
  isActive: false,
  remoteSessionId: null,
  startedAt: null,
  checkpointWindowStartedAt: null,
  elapsedSeconds: 0,
  checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
  distanceMiles: 0,
  setup: null,
  routeCoordinates: [],
  currentCoordinate: null,
  displayCoordinate: null,
  currentHeading: null,
  mapRecenterToken: 0,
  mapFollowEnabled: false,
  mapLayer: DEFAULT_MAP_LAYER,
  submittedCheckpoints: [],
};

let completedSessionSnapshot: CompletedSessionSnapshot | null = null;

let tickInterval: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
let headingSubscription: Location.LocationSubscription | null = null;
/** True once the device compass has delivered at least one reading for the
 * active session — GPS-derived heading is only used as a fallback until then. */
let compassAvailable = false;
let lastAcceptedTimestamp: number | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<LiveSessionState>) {
  state = { ...state, ...patch };
  notify();
}

function deriveElapsedSeconds(startedAt: number | null): number {
  if (startedAt == null) {
    return 0;
  }

  return Math.floor((Date.now() - startedAt) / 1000);
}

function deriveCheckpointSecondsRemaining(checkpointWindowStartedAt: number | null): number {
  if (checkpointWindowStartedAt == null) {
    return PHOTO_CHECKPOINT_INTERVAL_SECONDS;
  }

  const elapsedInWindow = Math.floor((Date.now() - checkpointWindowStartedAt) / 1000);
  return Math.max(0, PHOTO_CHECKPOINT_INTERVAL_SECONDS - elapsedInWindow);
}

function syncSessionClocks() {
  if (!state.isActive || state.startedAt == null) {
    return;
  }

  setState({
    elapsedSeconds: deriveElapsedSeconds(state.startedAt),
    checkpointSecondsRemaining: deriveCheckpointSecondsRemaining(state.checkpointWindowStartedAt),
  });
}

function startTicking() {
  if (tickInterval) {
    return;
  }

  tickInterval = setInterval(() => {
    if (!state.isActive) {
      return;
    }

    syncSessionClocks();
  }, 1000);
}

function stopTicking() {
  if (!tickInterval) {
    return;
  }

  clearInterval(tickInterval);
  tickInterval = null;
}

function recordLocationSample(position: Location.LocationObject) {
  if (!state.isActive || state.startedAt == null) {
    return;
  }

  const { latitude, longitude, accuracy, heading, speed } = position.coords;
  const sampleTimestamp = position.timestamp ?? Date.now();
  const nextCoordinate = toRouteCoordinate(longitude, latitude);
  const previousCoordinate = state.currentCoordinate;
  // The device compass (see `startHeadingWatching`) is the primary heading
  // source once available — it updates independently of GPS movement, like
  // a real compass. GPS-derived heading is only a fallback until then.
  const nextHeading = compassAvailable
    ? state.currentHeading
    : resolveHeading({ heading, previous: previousCoordinate, current: nextCoordinate });
  const nextDisplayCoordinate = smoothCoordinateEma(state.displayCoordinate, nextCoordinate);

  // Pin the map to the latest fix immediately, even before GPS accuracy
  // settles — otherwise the tracker never centers on the user while the
  // first fix(es) are still above `MAX_ACCEPTABLE_ACCURACY_METERS`. Route
  // accumulation (distance, polyline) below still requires the accuracy gate.
  setState({
    currentCoordinate: nextCoordinate,
    displayCoordinate: nextDisplayCoordinate,
    currentHeading: nextHeading,
  });

  if (!isAcceptableAccuracy(accuracy)) {
    return;
  }

  const speedMps = speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null;
  const deltaMs =
    lastAcceptedTimestamp != null ? sampleTimestamp - lastAcceptedTimestamp : 0;
  const deltaMetersFromLastFix = previousCoordinate
    ? deltaMetersBetween(previousCoordinate, nextCoordinate)
    : 0;

  const lastRoutePoint = state.routeCoordinates[state.routeCoordinates.length - 1];
  if (!lastRoutePoint) {
    lastAcceptedTimestamp = sampleTimestamp;
    setState({ routeCoordinates: [nextCoordinate] });
    return;
  }

  const prevRoutePoint =
    state.routeCoordinates.length >= 2
      ? state.routeCoordinates[state.routeCoordinates.length - 2]
      : null;
  const deltaMetersFromRoute = deltaMetersBetween(lastRoutePoint, nextCoordinate);

  if (
    shouldAppendRoutePoint({
      lastRoutePoint,
      prevRoutePoint,
      candidate: nextCoordinate,
      accuracyMeters: accuracy ?? MAX_ACCEPTABLE_ACCURACY_METERS,
      speedMps,
      deltaMetersFromRoute,
      deltaMetersFromLastFix,
      deltaMs,
      sessionStartedAt: state.startedAt,
      sampleTimestamp,
    })
  ) {
    const deltaMiles = haversineMiles(
      lastRoutePoint[1],
      lastRoutePoint[0],
      latitude,
      longitude,
    );

    lastAcceptedTimestamp = sampleTimestamp;
    setState({
      routeCoordinates: [...state.routeCoordinates, nextCoordinate],
      distanceMiles: state.distanceMiles + deltaMiles,
    });
    return;
  }

  lastAcceptedTimestamp = sampleTimestamp;
}

function stopLocationWatching() {
  locationSubscription?.remove();
  locationSubscription = null;
  lastAcceptedTimestamp = null;
  stopHeadingWatching();
}

function handleCompassUpdate(reading: Location.LocationHeadingObject) {
  const rawHeading = resolveCompassHeading(reading);
  if (rawHeading == null) {
    return;
  }

  compassAvailable = true;
  setState({ currentHeading: smoothHeadingEma(state.currentHeading, rawHeading) });
}

function stopHeadingWatching() {
  headingSubscription?.remove();
  headingSubscription = null;
  compassAvailable = false;
}

/** Subscribe to the device compass so the live marker's heading beam tracks
 * which way the phone is facing in real time, not just direction of travel. */
async function startHeadingWatching() {
  stopHeadingWatching();

  try {
    headingSubscription = await Location.watchHeadingAsync(handleCompassUpdate);
  } catch {
    // Compass unavailable (e.g. simulator with no magnetometer) — GPS-derived
    // heading in `recordLocationSample` remains the fallback.
  }
}

const LOCATION_WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,
  distanceInterval: MIN_ROUTE_SAMPLE_METERS,
  mayShowUserSettingsDialog: true,
  ...(Location.ActivityType && {
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
  }),
};

async function startLocationWatching() {
  stopLocationWatching();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  // Start the compass in parallel with the (slower) GPS fix below, rather
  // than after it — compass readings arrive almost instantly, so this is
  // what makes the heading beam appear right away instead of lagging a few
  // seconds behind the first GPS fix.
  void startHeadingWatching();

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    recordLocationSample(position);
  } catch {
    // Continue with watch subscription even if the initial fix fails.
  }

  locationSubscription = await Location.watchPositionAsync(
    LOCATION_WATCH_OPTIONS,
    (position) => {
      recordLocationSample(position);
    },
  );
}

async function persistCheckpointToRemote(checkpoint: PhotoCheckpointSubmission) {
  const sessionId = state.remoteSessionId;
  if (!sessionId) {
    return;
  }

  try {
    const paths = await uploadCheckpointPhotos({
      sessionId,
      checkpointId: checkpoint.id,
      selfieUri: checkpoint.selfieUri,
      progressUri: checkpoint.progressUri,
    });

    if (!paths) {
      return;
    }

    await addCheckpoint(sessionId, {
      selfiePath: paths.selfiePath,
      progressPath: paths.progressPath,
      capturedAt: new Date(checkpoint.capturedAt).toISOString(),
      submittedEarly: checkpoint.submittedEarly,
    });
  } catch (error) {
    console.warn('[sessions] checkpoint persist failed:', error);
  }
}

async function persistFinalizeToRemote(
  snapshot: CompletedSessionSnapshot,
  status: 'under_review' | 'invalid' = 'under_review',
) {
  const sessionId = snapshot.remoteSessionId;
  if (!sessionId) {
    return;
  }

  try {
    await finalizeSession(sessionId, {
      endedAt: new Date(snapshot.endedAt).toISOString(),
      durationSeconds: snapshot.elapsedSeconds,
      distanceMiles: snapshot.distanceMiles,
      route: snapshot.routeCoordinates,
      status,
    });
  } catch (error) {
    console.warn('[sessions] finalize persist failed:', error);
  }
}

/** Re-request location updates if the session is active but watching stopped (e.g. permission retry). */
export async function ensureLocationWatching() {
  if (!state.isActive || locationSubscription) {
    return;
  }

  await startLocationWatching();
}

/** Starts a fresh live session: elapsed at 0, checkpoint countdown at 30:00. */
export async function startNewLiveSession(setup: LiveSessionSetup) {
  stopTicking();
  stopLocationWatching();
  completedSessionSnapshot = null;

  // Fetch last-known position and remote session ID in parallel so the map
  // can center immediately when the WebView is ready, without waiting for a
  // fresh GPS fix (which can take several seconds on cold start).
  const [lastKnown, created] = await Promise.all([
    Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 }).catch(() => null),
    createSession({
      activity: setup.activity,
      courtOrdered: setup.courtOrdered,
      description: setup.description,
      date: setup.date.toISOString().slice(0, 10),
    }).catch((error) => {
      console.warn('[sessions] create session failed:', error);
      return null;
    }),
  ]);

  const remoteSessionId = created?.id ?? null;
  const prewarmCoord = lastKnown
    ? toRouteCoordinate(lastKnown.coords.longitude, lastKnown.coords.latitude)
    : null;
  // Seed the heading beam from the cached fix's GPS course, if any, so it
  // renders immediately instead of waiting for the compass's or a fresh GPS
  // fix's first reading. It's replaced by a live reading within moments.
  const prewarmHeading = resolveHeading({
    heading: lastKnown?.coords.heading,
    previous: null,
    current: prewarmCoord ?? DEFAULT_MAP_CENTER,
  });

  const startedAt = Date.now();
  state = {
    isActive: true,
    remoteSessionId,
    startedAt,
    checkpointWindowStartedAt: startedAt,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    distanceMiles: 0,
    setup,
    routeCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: prewarmCoord,
    currentHeading: prewarmHeading,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
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
  const checkpoint: PhotoCheckpointSubmission = {
    id: `checkpoint-${nextIndex}-${submission.capturedAt}`,
    submittedEarly,
    ...submission,
  };

  setState({
    submittedCheckpoints: [...state.submittedCheckpoints, checkpoint],
  });

  void persistCheckpointToRemote(checkpoint);

  return true;
}

/** Ensures the 1s session tick runs while a live session is active (e.g. after fast refresh). */
export function ensureLiveSessionTicking() {
  if (state.isActive) {
    syncSessionClocks();
    startTicking();
  }
}

/** Resets only the checkpoint countdown after a photo is submitted. */
export function resetCheckpointCountdown() {
  if (!state.isActive) {
    return;
  }

  setState({
    checkpointWindowStartedAt: Date.now(),
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
  });
  startTicking();
}

export function finalizeLiveSession(options?: { status?: 'under_review' | 'invalid' }) {
  if (!state.setup) {
    endLiveSession();
    return;
  }

  const endedAt = Date.now();
  const startedAt = state.startedAt ?? endedAt;
  const status = options?.status ?? 'under_review';
  completedSessionSnapshot = {
    remoteSessionId: state.remoteSessionId,
    setup: state.setup,
    startedAt,
    endedAt,
    elapsedSeconds: computeSessionDurationSeconds(startedAt, endedAt),
    distanceMiles: state.distanceMiles,
    routeCoordinates: [...state.routeCoordinates],
    submittedCheckpoints: [...state.submittedCheckpoints],
    mapLayer: state.mapLayer,
  };

  void persistFinalizeToRemote(completedSessionSnapshot, status);
  recordCompletedSession(completedSessionSnapshot);
  cacheCompletedSession(completedSessionSnapshot);
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
    remoteSessionId: null,
    startedAt: null,
    checkpointWindowStartedAt: null,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    distanceMiles: 0,
    setup: null,
    routeCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: null,
    currentHeading: null,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
    submittedCheckpoints: [],
  };
  notify();
}

export function setLiveSessionMapFollow(enabled: boolean) {
  if (state.mapFollowEnabled === enabled) {
    return;
  }

  setState({ mapFollowEnabled: enabled });
}

export function toggleLiveSessionMapFollow() {
  setLiveSessionMapFollow(!state.mapFollowEnabled);
}

export function setLiveSessionMapLayer(layer: MapLayerType) {
  if (state.mapLayer === layer) {
    return;
  }

  setState({ mapLayer: layer });
}

export function requestLiveSessionMapRecenter() {
  if (!state.displayCoordinate && !state.currentCoordinate) {
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
  return (
    state.displayCoordinate ??
    state.currentCoordinate ??
    state.routeCoordinates[0] ??
    DEFAULT_MAP_CENTER
  );
}

export function getLiveSessionMapZoom(hasFix: boolean): number {
  return hasFix ? 15 : 4;
}
