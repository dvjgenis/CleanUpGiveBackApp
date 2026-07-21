import * as Location from 'expo-location';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import {
  addCheckpoint,
  createSession,
  finalizeSession,
} from '@/lib/sessionsApi';
import { uploadCheckpointPhotos } from '@/lib/uploadCheckpointPhotos';

import { BACKGROUND_LOCATION_TASK } from './backgroundLocationConstants';
import {
  CHECKPOINT_MISS_GRACE_MS,
  PHOTO_CHECKPOINT_INTERVAL_SECONDS,
} from './checkpointConstants';
import { recordCompletedSession } from './recentSessionsStore';
import { cacheCompletedSession } from './completedSessionCache';
import { recordSessionStatFromSnapshot } from './sessionStatsStore';
import { DEFAULT_MAP_LAYER, type MapLayerType } from './utils/mapStyles';
import { computeSessionDurationSeconds } from './utils/sessionFormat';
import {
  haversineMiles,
  isRouteCoordinate,
  MIN_ROUTE_SAMPLE_METERS,
  toRouteCoordinate,
  type RouteCoordinate,
} from './utils/geo';
import {
  createLocationKalmanFilter,
  resetLocationKalmanFilter,
  updateLocationKalman,
  type LocationKalmanFilter,
} from './utils/locationKalman';
import {
  deltaMetersBetween,
  isAcceptableAccuracy,
  resolveAccuracyMeters,
  resolveCompassHeading,
  resolveHeading,
  shouldAppendRoutePoint,
  shouldSkipDuplicateLocationSample,
  simplifyRouteForDisplay,
  simplifyRouteForLiveDisplay,
  smoothCoordinateEma,
  smoothHeadingEma,
  type RouteSample,
} from './utils/routeFiltering';
import {
  cancelCheckpointNotifications,
  scheduleCheckpointNotifications,
} from './checkpointNotifications';
import {
  clearLiveSessionDraft,
  liveSessionSetupFromDraft,
  persistLiveSessionDraftDebounced,
  resolveLiveSessionResumeOffer,
  type LiveSessionDraft,
  type LiveSessionResumeOffer,
} from './liveSessionDraft';

export { CHECKPOINT_MISS_GRACE_MS, PHOTO_CHECKPOINT_INTERVAL_SECONDS } from './checkpointConstants';

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
  routeSamples: RouteSample[];
  submittedCheckpoints: PhotoCheckpointSubmission[];
  /** Basemap layer at session end — preserved for route replay screens. */
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
  routeSamples: RouteSample[];
  displayRouteCoordinates: RouteCoordinate[];
  currentCoordinate: RouteCoordinate | null;
  displayCoordinate: RouteCoordinate | null;
  currentHeading: number | null;
  mapRecenterToken: number;
  mapFollowEnabled: boolean;
  mapLayer: MapLayerType;
  submittedCheckpoints: PhotoCheckpointSubmission[];
  sessionSyncWarning: string | null;
  backgroundLocationEnabled: boolean;
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
  routeSamples: [],
  displayRouteCoordinates: [],
  currentCoordinate: null,
  displayCoordinate: null,
  currentHeading: null,
  mapRecenterToken: 0,
  mapFollowEnabled: false,
  mapLayer: DEFAULT_MAP_LAYER,
  submittedCheckpoints: [],
  sessionSyncWarning: null,
  backgroundLocationEnabled: false,
};

let completedSessionSnapshot: CompletedSessionSnapshot | null = null;

let tickInterval: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
let headingSubscription: Location.LocationSubscription | null = null;
let lastAcceptedTimestamp: number | null = null;
let lastRouteAppendTimestamp: number | null = null;
let lastProcessedSampleTimestamp: number | null = null;
let lastProcessedCoordinate: RouteCoordinate | null = null;
let pendingResumeOffer: LiveSessionResumeOffer | null = null;
let pendingMissedCheckpointNavigation = false;
let locationKalman: LocationKalmanFilter = createLocationKalmanFilter();
let compassAvailable = false;
let lastHeadingNotifyMs = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<LiveSessionState>) {
  state = { ...state, ...patch };
  notify();
  if (state.isActive) {
    persistLiveSessionDraftDebounced(state);
  }
}

function setSessionSyncWarning(message: string | null) {
  if (state.sessionSyncWarning === message) {
    return;
  }

  setState({ sessionSyncWarning: message });
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
  evaluateCheckpointMissAndFinalize();
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

function buildDisplayRoute(routeCoordinates: RouteCoordinate[]): RouteCoordinate[] {
  return simplifyRouteForLiveDisplay(routeCoordinates);
}

function resolveLastRoutePoint(
  routeCoordinates: RouteCoordinate[],
  fallback: RouteCoordinate | null,
): RouteCoordinate | null {
  const tail =
    routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null;
  if (isRouteCoordinate(tail)) {
    return tail;
  }
  if (isRouteCoordinate(fallback)) {
    return fallback;
  }
  return null;
}

function appendRouteSample(sample: RouteSample) {
  const displayRouteCoordinates = buildDisplayRoute([...state.routeCoordinates, sample.coordinate]);
  setState({
    routeCoordinates: [...state.routeCoordinates, sample.coordinate],
    routeSamples: [...state.routeSamples, sample],
    displayRouteCoordinates,
  });
}

function recordLocationSample(position: Location.LocationObject) {
  if (!state.isActive || state.startedAt == null) {
    return;
  }

  const sampleTimestamp = position.timestamp ?? Date.now();

  const { latitude, longitude, accuracy, heading, speed } = position.coords;
  const resolvedAccuracy = resolveAccuracyMeters(accuracy);
  const filteredCoordinate = updateLocationKalman(locationKalman, {
    latitude,
    longitude,
    accuracyMeters: resolvedAccuracy,
    timestampMs: sampleTimestamp,
  });

  if (!isRouteCoordinate(filteredCoordinate)) {
    return;
  }

  if (
    lastProcessedSampleTimestamp != null &&
    !isRouteCoordinate(lastProcessedCoordinate)
  ) {
    lastProcessedSampleTimestamp = null;
    lastProcessedCoordinate = null;
  }

  if (
    shouldSkipDuplicateLocationSample({
      sampleTimestampMs: sampleTimestamp,
      coordinate: filteredCoordinate,
      lastProcessedTimestampMs: lastProcessedSampleTimestamp,
      lastProcessedCoordinate,
    })
  ) {
    lastProcessedSampleTimestamp = sampleTimestamp;
    return;
  }

  lastProcessedSampleTimestamp = sampleTimestamp;
  lastProcessedCoordinate = filteredCoordinate;

  const previousCoordinate = state.currentCoordinate;
  const nextHeading = compassAvailable
    ? state.currentHeading
    : resolveHeading({
        heading,
        previous: previousCoordinate,
        current: filteredCoordinate,
      });
  const nextDisplayCoordinate = smoothCoordinateEma(state.displayCoordinate, filteredCoordinate);

  // Pin the map to the latest fix immediately, even before GPS accuracy settles.
  setState({
    currentCoordinate: filteredCoordinate,
    displayCoordinate: nextDisplayCoordinate,
    currentHeading: nextHeading,
  });

  if (!isAcceptableAccuracy(accuracy)) {
    return;
  }

  const speedMps = speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null;
  const deltaMs =
    lastAcceptedTimestamp != null ? sampleTimestamp - lastAcceptedTimestamp : 0;
  const deltaMetersFromLastFix = isRouteCoordinate(previousCoordinate)
    ? deltaMetersBetween(previousCoordinate, filteredCoordinate)
    : 0;

  const sample: RouteSample = {
    coordinate: filteredCoordinate,
    accuracyMeters: resolvedAccuracy,
    speedMps,
    heading: nextHeading,
    timestampMs: sampleTimestamp,
  };

  // Seed on an empty route (not `!previousCoordinate`): a sample can set
  // `currentCoordinate` and still be rejected below for poor accuracy before
  // ever appending to `routeCoordinates`, which would otherwise make later
  // samples skip seeding while `routeCoordinates` is still empty and crash
  // on `state.routeCoordinates[-1]` being `undefined`.
  if (state.routeCoordinates.length === 0) {
    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    setState({
      routeCoordinates: [filteredCoordinate],
      routeSamples: [sample],
      displayRouteCoordinates: buildDisplayRoute([filteredCoordinate]),
    });
    return;
  }

  const lastRoutePoint = resolveLastRoutePoint(state.routeCoordinates, previousCoordinate);
  if (!lastRoutePoint) {
    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    setState({
      routeCoordinates: [filteredCoordinate],
      routeSamples: [sample],
      displayRouteCoordinates: buildDisplayRoute([filteredCoordinate]),
    });
    return;
  }

  const prevRoutePointRaw =
    state.routeCoordinates.length >= 2
      ? state.routeCoordinates[state.routeCoordinates.length - 2]
      : null;
  const prevRoutePoint = isRouteCoordinate(prevRoutePointRaw) ? prevRoutePointRaw : null;
  const deltaMetersFromRoute = deltaMetersBetween(lastRoutePoint, filteredCoordinate);

  if (
    shouldAppendRoutePoint({
      lastRoutePoint,
      prevRoutePoint,
      candidate: filteredCoordinate,
      accuracyMeters: resolvedAccuracy,
      speedMps,
      deltaMetersFromRoute,
      deltaMetersFromLastFix,
      deltaMs,
      sessionStartedAt: state.startedAt,
      sampleTimestamp,
      lastRouteAppendTimestamp,
    })
  ) {
    const deltaMiles = haversineMiles(
      lastRoutePoint[1],
      lastRoutePoint[0],
      filteredCoordinate[1],
      filteredCoordinate[0],
    );

    lastAcceptedTimestamp = sampleTimestamp;
    lastRouteAppendTimestamp = sampleTimestamp;
    appendRouteSample(sample);
    setState({
      distanceMiles: state.distanceMiles + deltaMiles,
    });
    return;
  }

  lastAcceptedTimestamp = sampleTimestamp;
}

export function ingestBackgroundLocationSample(position: Location.LocationObject) {
  recordLocationSample(position);
  evaluateCheckpointMissAndFinalize();
}

function getForegroundWatchOptions(): Location.LocationOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: MIN_ROUTE_SAMPLE_METERS,
    mayShowUserSettingsDialog: true,
    ...(Location.ActivityType && {
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
    }),
  };
}

function getBackgroundWatchOptions(): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: MIN_ROUTE_SAMPLE_METERS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Clean Up Give Back',
      notificationBody: 'Tracking your cleanup route',
      notificationColor: '#009540',
    },
    ...(Location.ActivityType && {
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
    }),
  };
}

/** Min turn (deg) before notifying React; below this is magnetometer noise. */
const HEADING_NOTIFY_MIN_DELTA_DEG = 0.35;
/** Cap store publish rate (~30 Hz) so listeners stay responsive without thrashing. */
const HEADING_NOTIFY_MIN_INTERVAL_MS = 33;

function handleCompassUpdate(reading: Location.LocationHeadingObject) {
  const rawHeading = resolveCompassHeading({
    trueHeading: reading.trueHeading,
    magHeading: reading.magHeading,
    accuracy: reading.accuracy,
    platform: Platform.OS,
  });
  if (rawHeading == null) {
    return;
  }

  compassAvailable = true;
  // Adaptive EMA: snap on large turns, damp when nearly still.
  const newHeading = smoothHeadingEma(state.currentHeading, rawHeading);
  const now = Date.now();
  const prevHeading = state.currentHeading ?? 0;
  const delta = Math.abs(((newHeading - prevHeading + 180) % 360 + 360) % 360 - 180);
  if (delta < HEADING_NOTIFY_MIN_DELTA_DEG || now - lastHeadingNotifyMs < HEADING_NOTIFY_MIN_INTERVAL_MS) {
    return;
  }
  lastHeadingNotifyMs = now;
  setState({ currentHeading: newHeading });
}

async function startHeadingWatching() {
  headingSubscription?.remove();
  headingSubscription = null;

  try {
    headingSubscription = await Location.watchHeadingAsync(handleCompassUpdate);
  } catch {
    // Compass unavailable — GPS-derived heading in recordLocationSample is the fallback.
  }
}

function stopHeadingWatching() {
  headingSubscription?.remove();
  headingSubscription = null;
  compassAvailable = false;
}

async function startBackgroundLocationUpdates(): Promise<boolean> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, getBackgroundWatchOptions());
    return true;
  } catch (error) {
    console.warn('[location] background updates failed:', error);
    return false;
  }
}

async function stopBackgroundLocationUpdates() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.warn('[location] stop background updates failed:', error);
  }
}

/** Stops subscriptions only — preserves Kalman and append timestamps (mid-session resume). */
function stopLocationSubscriptions() {
  locationSubscription?.remove();
  locationSubscription = null;
  stopHeadingWatching();
  void stopBackgroundLocationUpdates();
}

/** Full teardown when a session ends or before a fresh Kalman/route reset. */
function stopLocationWatching() {
  stopLocationSubscriptions();
  lastAcceptedTimestamp = null;
  lastRouteAppendTimestamp = null;
  lastProcessedSampleTimestamp = null;
  lastProcessedCoordinate = null;
  resetLocationKalmanFilter(locationKalman);
}

/** One-shot GPS can hang indefinitely on some devices — never await it untimed. */
const INITIAL_FIX_TIMEOUT_MS = 8000;

async function getCurrentPositionWithTimeout(): Promise<Location.LocationObject | null> {
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), INITIAL_FIX_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}

/** Best-effort seed so the tracker map can mount centered on the user ASAP. */
async function seedInitialLocation() {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 15 * 60 * 1000,
      requiredAccuracy: 1000,
    });
    if (lastKnown) {
      recordLocationSample(lastKnown);
    }
  } catch {
    // Fall through to a timed current fix.
  }

  if (state.currentCoordinate) {
    return;
  }

  const position = await getCurrentPositionWithTimeout();
  if (position) {
    recordLocationSample(position);
  }
}

async function enableBackgroundLocationIfPossible() {
  let backgroundEnabled = false;
  try {
    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    backgroundEnabled = backgroundPermission.status === 'granted';
    if (backgroundEnabled) {
      backgroundEnabled = await startBackgroundLocationUpdates();
    }
  } catch {
    backgroundEnabled = false;
  }

  if (backgroundEnabled) {
    setSessionSyncWarning(null);
  }

  setState({ backgroundLocationEnabled: backgroundEnabled });
}

async function startLocationWatching() {
  stopLocationSubscriptions();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    setSessionSyncWarning('Location permission denied — route tracking is unavailable.');
    return;
  }

  // Compass + continuous watch first. Never block them behind Always permission
  // or getCurrentPositionAsync — both can stall and leave the map on a spinner
  // (map mounts only after a GPS seed).
  void startHeadingWatching();

  try {
    locationSubscription = await Location.watchPositionAsync(
      getForegroundWatchOptions(),
      (position) => {
        recordLocationSample(position);
      },
    );
  } catch (error) {
    console.warn('[location] foreground watch failed:', error);
    locationSubscription = null;
    return;
  }

  void seedInitialLocation();
  void enableBackgroundLocationIfPossible();
}

async function ensureBackgroundLocationRunning() {
  if (!state.isActive) {
    return;
  }

  try {
    const backgroundPermission = await Location.getBackgroundPermissionsAsync();
    if (backgroundPermission.status !== 'granted') {
      return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      setState({ backgroundLocationEnabled: true });
      return;
    }

    const started = await startBackgroundLocationUpdates();
    setState({ backgroundLocationEnabled: started });
  } catch {
    setState({ backgroundLocationEnabled: false });
  }
}

async function persistCheckpointToRemote(checkpoint: PhotoCheckpointSubmission): Promise<boolean> {
  const sessionId = state.remoteSessionId;
  if (!sessionId) {
    return false;
  }

  try {
    const paths = await uploadCheckpointPhotos({
      sessionId,
      checkpointId: checkpoint.id,
      selfieUri: checkpoint.selfieUri,
      progressUri: checkpoint.progressUri,
    });

    if (!paths) {
      setSessionSyncWarning('Photo upload failed — checkpoint not saved to the server.');
      return false;
    }

    await addCheckpoint(sessionId, {
      selfiePath: paths.selfiePath,
      progressPath: paths.progressPath,
      capturedAt: new Date(checkpoint.capturedAt).toISOString(),
      submittedEarly: checkpoint.submittedEarly,
    });

    return true;
  } catch (error) {
    console.warn('[sessions] checkpoint persist failed:', error);
    setSessionSyncWarning('Could not sync checkpoint to the server. Photos are saved on device.');
    return false;
  }
}

async function persistFinalizeToRemote(
  snapshot: CompletedSessionSnapshot,
  status: 'under_review' | 'invalid' = 'under_review',
): Promise<boolean> {
  const sessionId = snapshot.remoteSessionId;
  if (!sessionId) {
    return false;
  }

  try {
    await finalizeSession(sessionId, {
      endedAt: new Date(snapshot.endedAt).toISOString(),
      durationSeconds: snapshot.elapsedSeconds,
      distanceMiles: snapshot.distanceMiles,
      route: snapshot.routeCoordinates,
      status,
    });
    return true;
  } catch (error) {
    console.warn('[sessions] finalize persist failed:', error);
    setSessionSyncWarning('Could not sync session to the server. Your route is saved on device.');
    return false;
  }
}

/** Re-request location updates if the session is active but watching stopped (e.g. permission retry). */
export async function ensureLocationWatching() {
  if (!state.isActive || locationSubscription) {
    return;
  }

  await startLocationWatching();
}

/** Sync clocks and restart GPS after returning from background (Expo Go / When In Use). */
export async function resumeLiveSessionTrackingAfterForeground() {
  if (!state.isActive) {
    return;
  }

  syncSessionClocks();
  ensureLiveSessionTicking();
  await startLocationWatching();
  await ensureBackgroundLocationRunning();
}

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

function ensureLiveSessionAppStateListener() {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState !== 'active') {
      return;
    }

    void resumeLiveSessionTrackingAfterForeground();
  });
}

ensureLiveSessionAppStateListener();

export function hasSubmittedCheckpointForCurrentWindow(): boolean {
  const windowStart = state.checkpointWindowStartedAt;
  if (!windowStart) {
    return false;
  }

  return state.submittedCheckpoints.some((checkpoint) => checkpoint.capturedAt >= windowStart);
}

export function isCheckpointMissed(): boolean {
  if (!state.isActive || state.checkpointWindowStartedAt == null) {
    return false;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return false;
  }

  const overdueMs = Date.now() - state.checkpointWindowStartedAt;
  return (
    overdueMs >
    PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000 + CHECKPOINT_MISS_GRACE_MS
  );
}

export function isCheckpointInGracePeriod(): boolean {
  if (!state.isActive || state.checkpointWindowStartedAt == null) {
    return false;
  }

  if (hasSubmittedCheckpointForCurrentWindow()) {
    return false;
  }

  const overdueMs = Date.now() - state.checkpointWindowStartedAt;
  const intervalMs = PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
  return overdueMs >= intervalMs && overdueMs <= intervalMs + CHECKPOINT_MISS_GRACE_MS;
}

export function isDraftCheckpointMissed(draft: LiveSessionDraft): boolean {
  const windowStart = draft.checkpointWindowStartedAt;
  const submittedInWindow = draft.submittedCheckpoints.some(
    (checkpoint) => checkpoint.capturedAt >= windowStart,
  );
  if (submittedInWindow) {
    return false;
  }

  const overdueMs = Date.now() - windowStart;
  return (
    overdueMs >
    PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000 + CHECKPOINT_MISS_GRACE_MS
  );
}

export function consumePendingMissedCheckpointNavigation(): boolean {
  const pending = pendingMissedCheckpointNavigation;
  pendingMissedCheckpointNavigation = false;
  return pending;
}

/** Finalizes an invalid session when the grace window has expired. */
export function evaluateCheckpointMissAndFinalize(): boolean {
  if (!isCheckpointMissed()) {
    return false;
  }

  pendingMissedCheckpointNavigation = true;
  finalizeLiveSession({ status: 'invalid' });
  return true;
}

export function clearSessionSyncWarning() {
  setSessionSyncWarning(null);
}

/** Starts a fresh live session: elapsed at 0, checkpoint countdown at 30:00. */
export async function startNewLiveSession(setup: LiveSessionSetup) {
  stopTicking();
  stopLocationWatching();
  completedSessionSnapshot = null;
  locationKalman = createLocationKalmanFilter();

  // Activate locally first so the tracker map can seed from last-known GPS
  // without waiting on the create-session network round-trip (and without
  // flashing the continental US default center).
  const startedAt = Date.now();
  state = {
    isActive: true,
    remoteSessionId: null,
    startedAt,
    checkpointWindowStartedAt: startedAt,
    elapsedSeconds: 0,
    checkpointSecondsRemaining: PHOTO_CHECKPOINT_INTERVAL_SECONDS,
    distanceMiles: 0,
    setup,
    routeCoordinates: [],
    routeSamples: [],
    displayRouteCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: null,
    currentHeading: null,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
    submittedCheckpoints: [],
    sessionSyncWarning: null,
    backgroundLocationEnabled: false,
  };
  notify();
  startTicking();
  void startLocationWatching();
  persistLiveSessionDraftDebounced(state);
  void scheduleCheckpointNotifications(startedAt);

  try {
    const created = await createSession({
      activity: setup.activity,
      courtOrdered: setup.courtOrdered,
      description: setup.description,
      date: setup.date.toISOString().slice(0, 10),
    });
    if (created?.id) {
      setState({ remoteSessionId: created.id });
    }
  } catch (error) {
    console.warn('[sessions] create session failed:', error);
  }
}

/** Records a submitted selfie + progress photo pair for the session detail screen. */
export function addPhotoCheckpoint(submission: {
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
}): boolean {
  if (!state.isActive) {
    return false;
  }

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
  if (state.checkpointWindowStartedAt != null) {
    void scheduleCheckpointNotifications(state.checkpointWindowStartedAt);
  }
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
    routeSamples: [...state.routeSamples],
    submittedCheckpoints: [...state.submittedCheckpoints],
    mapLayer: state.mapLayer,
  };

  void persistFinalizeToRemote(completedSessionSnapshot, status);
  recordCompletedSession(completedSessionSnapshot);
  recordSessionStatFromSnapshot(completedSessionSnapshot);
  cacheCompletedSession(completedSessionSnapshot);
  endLiveSession();
}

export function getCompletedSessionSnapshot() {
  return completedSessionSnapshot;
}

export function endLiveSession() {
  stopTicking();
  stopLocationWatching();
  void clearLiveSessionDraft();
  void cancelCheckpointNotifications();
  pendingResumeOffer = null;
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
    routeSamples: [],
    displayRouteCoordinates: [],
    currentCoordinate: null,
    displayCoordinate: null,
    currentHeading: null,
    mapRecenterToken: 0,
    mapFollowEnabled: false,
    mapLayer: DEFAULT_MAP_LAYER,
    submittedCheckpoints: [],
    sessionSyncWarning: null,
    backgroundLocationEnabled: false,
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

export function getLiveSessionMapCenter(): RouteCoordinate | null {
  return state.displayCoordinate ?? state.currentCoordinate ?? state.routeCoordinates[0] ?? null;
}

export function getLiveSessionMapZoom(): number {
  return 15;
}

export function getPendingLiveSessionResume(): LiveSessionResumeOffer | null {
  return pendingResumeOffer;
}

export async function bootstrapLiveSessionResumeOffer() {
  if (state.isActive) {
    pendingResumeOffer = null;
    notify();
    return;
  }

  pendingResumeOffer = await resolveLiveSessionResumeOffer();
  if (pendingResumeOffer && isDraftCheckpointMissed(pendingResumeOffer.draft)) {
    await resumeLiveSessionFromDraft(pendingResumeOffer.draft);
    evaluateCheckpointMissAndFinalize();
    pendingResumeOffer = null;
    notify();
    return;
  }

  notify();
}

export async function resumeLiveSessionFromDraft(draft: LiveSessionDraft) {
  stopTicking();
  stopLocationWatching();
  completedSessionSnapshot = null;
  locationKalman = createLocationKalmanFilter();

  const setup = liveSessionSetupFromDraft(draft);
  const sanitizedRoute = draft.routeCoordinates.filter(isRouteCoordinate);
  const sanitizedSamples = draft.routeSamples.filter((sample) =>
    isRouteCoordinate(sample.coordinate),
  );
  const lastSample = sanitizedSamples[sanitizedSamples.length - 1];
  const lastCoord =
    sanitizedRoute[sanitizedRoute.length - 1] ??
    lastSample?.coordinate ??
    null;

  lastAcceptedTimestamp = lastSample?.timestampMs ?? null;
  lastRouteAppendTimestamp = lastSample?.timestampMs ?? null;
  lastProcessedSampleTimestamp = lastSample?.timestampMs ?? null;
  lastProcessedCoordinate = lastCoord;

  state = {
    isActive: true,
    remoteSessionId: draft.remoteSessionId,
    startedAt: draft.startedAt,
    checkpointWindowStartedAt: draft.checkpointWindowStartedAt,
    elapsedSeconds: deriveElapsedSeconds(draft.startedAt),
    checkpointSecondsRemaining: deriveCheckpointSecondsRemaining(draft.checkpointWindowStartedAt),
    distanceMiles: draft.distanceMiles,
    setup,
    routeCoordinates: [...sanitizedRoute],
    routeSamples: [...sanitizedSamples],
    displayRouteCoordinates: buildDisplayRoute(sanitizedRoute),
    currentCoordinate: lastCoord,
    displayCoordinate: lastCoord,
    currentHeading: lastSample?.heading ?? null,
    mapRecenterToken: 0,
    mapFollowEnabled: draft.mapFollowEnabled,
    mapLayer: draft.mapLayer,
    submittedCheckpoints: [...draft.submittedCheckpoints],
    sessionSyncWarning: null,
    backgroundLocationEnabled: false,
  };

  pendingResumeOffer = null;
  notify();
  startTicking();
  void startLocationWatching();
  persistLiveSessionDraftDebounced(state);
  if (state.checkpointWindowStartedAt != null) {
    void scheduleCheckpointNotifications(state.checkpointWindowStartedAt);
  }
}

export async function discardPendingLiveSessionResume() {
  pendingResumeOffer = null;
  await clearLiveSessionDraft();
  notify();
}
