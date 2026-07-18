import {
  haversineMiles,
  milesToMeters,
  MIN_ROUTE_SAMPLE_METERS,
  type RouteCoordinate,
} from './geo';
import { DEFAULT_ACCURACY_METERS } from './locationKalman';

/** Reject fixes with horizontal accuracy worse than this (meters). */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 15;

/** After this gap since last route append, relax movement gates (ms). */
export const ROUTE_GAP_RECOVERY_MS = 30_000;

/** Reject implied speeds above this when appending route points (m/s). */
export const MAX_PLAUSIBLE_SPEED_MPS = 6;

/** Device-reported speed below this is treated as stationary (m/s). */
export const MIN_SPEED_TO_RECORD_MPS = 0.4;

/** Ignore route appends for this long after session start (ms). */
export const GPS_WARMUP_MS = 8000;

/** EMA weight for live arrow smoothing (display only). */
export const DISPLAY_COORDINATE_EMA_ALPHA = 0.35;

/** Douglas-Peucker tolerance for display simplification (meters). */
export const DISPLAY_SIMPLIFY_TOLERANCE_METERS = 4;

export type MotionState = 'walking' | 'stationary';

export type RouteSample = {
  coordinate: RouteCoordinate;
  accuracyMeters: number;
  speedMps: number | null;
  heading: number | null;
  timestampMs: number;
};

/** Max distance for sharp-reversal outlier detection (meters). */
const SHARP_REVERSAL_MAX_DISTANCE_METERS = 12;

/** Bearing change above this with short segment is treated as a spike (degrees). */
const SHARP_REVERSAL_BEARING_DEGREES = 120;

export function resolveAccuracyMeters(accuracyMeters: number | null | undefined): number {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    return DEFAULT_ACCURACY_METERS;
  }

  return accuracyMeters;
}

export function isAcceptableAccuracy(accuracyMeters: number | null | undefined): boolean {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters)) {
    return true;
  }

  return accuracyMeters > 0 && accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

export function isPlausibleMovement(
  deltaMeters: number,
  deltaMs: number,
  options?: { relaxed?: boolean },
): boolean {
  if (deltaMs <= 0) {
    return deltaMeters === 0;
  }

  const speedMps = deltaMeters / (deltaMs / 1000);
  const maxSpeed = options?.relaxed ? MAX_PLAUSIBLE_SPEED_MPS * 1.35 : MAX_PLAUSIBLE_SPEED_MPS;
  return speedMps <= maxSpeed;
}

/** Movement must exceed GPS error radius before appending a route point. */
export function getMinMovementMeters(accuracyMeters: number): number {
  const safeAccuracy = resolveAccuracyMeters(accuracyMeters);
  return Math.max(MIN_ROUTE_SAMPLE_METERS, safeAccuracy * 0.35);
}

export function detectMotionState(
  speedMps: number | null,
  deltaMeters: number,
  deltaMs: number,
): MotionState {
  const impliedSpeed = deltaMs > 0 ? deltaMeters / (deltaMs / 1000) : 0;
  const effectiveSpeed = speedMps != null && Number.isFinite(speedMps) ? speedMps : impliedSpeed;
  return effectiveSpeed >= MIN_SPEED_TO_RECORD_MPS ? 'walking' : 'stationary';
}

type StationaryInput = {
  speedMps: number | null;
  deltaMeters: number;
  deltaMs: number;
  minMovementMeters: number;
};

export function isStationary({
  speedMps,
  deltaMeters,
  deltaMs,
  minMovementMeters,
}: StationaryInput): boolean {
  const impliedSpeed =
    deltaMs > 0 ? deltaMeters / (deltaMs / 1000) : 0;

  if (speedMps != null && Number.isFinite(speedMps) && speedMps >= 0) {
    if (speedMps < MIN_SPEED_TO_RECORD_MPS && deltaMeters < minMovementMeters * 1.5) {
      return true;
    }
  }

  return impliedSpeed < MIN_SPEED_TO_RECORD_MPS && deltaMeters < minMovementMeters;
}

function bearingDifferenceDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Reject GPS spikes that reverse direction sharply over a short segment. */
export function isSharpReversal(
  prevRoutePoint: RouteCoordinate,
  lastRoutePoint: RouteCoordinate,
  candidate: RouteCoordinate,
): boolean {
  const segmentMeters = deltaMetersBetween(lastRoutePoint, candidate);
  if (segmentMeters > SHARP_REVERSAL_MAX_DISTANCE_METERS) {
    return false;
  }

  const inboundBearing = computeBearingDegrees(prevRoutePoint, lastRoutePoint);
  const outboundBearing = computeBearingDegrees(lastRoutePoint, candidate);
  const turn = bearingDifferenceDegrees(inboundBearing, outboundBearing);

  return turn >= SHARP_REVERSAL_BEARING_DEGREES;
}

export type AppendRoutePointInput = {
  lastRoutePoint: RouteCoordinate;
  prevRoutePoint: RouteCoordinate | null;
  candidate: RouteCoordinate;
  accuracyMeters: number;
  speedMps: number | null;
  deltaMetersFromRoute: number;
  deltaMetersFromLastFix: number;
  deltaMs: number;
  sessionStartedAt: number;
  sampleTimestamp: number;
  lastRouteAppendTimestamp: number | null;
};

export function shouldAppendRoutePoint(input: AppendRoutePointInput): boolean {
  const {
    lastRoutePoint,
    prevRoutePoint,
    candidate,
    accuracyMeters,
    speedMps,
    deltaMetersFromRoute,
    deltaMetersFromLastFix,
    deltaMs,
    sessionStartedAt,
    sampleTimestamp,
    lastRouteAppendTimestamp,
  } = input;

  if (sampleTimestamp - sessionStartedAt < GPS_WARMUP_MS) {
    return false;
  }

  const minMovementMeters = getMinMovementMeters(accuracyMeters);
  const gapSinceRouteAppend =
    lastRouteAppendTimestamp != null ? sampleTimestamp - lastRouteAppendTimestamp : deltaMs;
  const longGapRecovery = gapSinceRouteAppend >= ROUTE_GAP_RECOVERY_MS;
  const effectiveMinMovement = longGapRecovery ? minMovementMeters * 0.5 : minMovementMeters;

  if (deltaMetersFromRoute < effectiveMinMovement) {
    return false;
  }

  if (
    isStationary({
      speedMps,
      deltaMeters: deltaMetersFromLastFix,
      deltaMs,
      minMovementMeters: effectiveMinMovement,
    })
  ) {
    return false;
  }

  if (!isPlausibleMovement(deltaMetersFromLastFix, deltaMs, { relaxed: longGapRecovery })) {
    return false;
  }

  if (prevRoutePoint && isSharpReversal(prevRoutePoint, lastRoutePoint, candidate)) {
    return false;
  }

  return true;
}

/** Bearing in degrees clockwise from north (0–360). */
export function computeBearingDegrees(from: RouteCoordinate, to: RouteCoordinate): number {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

type HeadingInput = {
  heading?: number | null;
  previous: RouteCoordinate | null;
  current: RouteCoordinate;
};

/** Prefer GPS heading when valid; otherwise derive from last movement. Used
 * only as a fallback while the device compass is unavailable — see
 * `resolveCompassHeading` for the primary heading source. */
export function resolveHeading({ heading, previous, current }: HeadingInput): number | null {
  if (heading != null && Number.isFinite(heading) && heading >= 0) {
    return heading;
  }

  if (!previous) {
    return null;
  }

  return computeBearingDegrees(previous, current);
}

type CompassHeadingInput = {
  trueHeading?: number | null;
  magHeading?: number | null;
  /** Platform-specific compass accuracy from `Location.watchHeadingAsync`. */
  accuracy?: number | null;
};

/** iOS reports accuracy as degrees of deviation (lower is better). */
const IOS_TRUE_HEADING_MAX_DEVIATION_DEG = 25;

/**
 * Resolves a compass reading (from `Location.watchHeadingAsync`) to a single
 * heading in degrees.
 *
 * Prefers true-north when available and sufficiently calibrated; otherwise
 * uses magnetic-north. Returns null when neither reading is usable (avoids
 * locking onto `-1` / uncalibrated spikes that make the UI spin).
 */
export function resolveCompassHeading({
  trueHeading,
  magHeading,
  accuracy = null,
}: CompassHeadingInput): number | null {
  const trueOk =
    trueHeading != null && Number.isFinite(trueHeading) && trueHeading >= 0;
  const magOk =
    magHeading != null && Number.isFinite(magHeading) && magHeading >= 0;

  if (trueOk && isTrueHeadingReliable(accuracy)) {
    return trueHeading;
  }

  if (magOk) {
    return magHeading;
  }

  // Last resort: accept true heading even with unknown accuracy.
  if (trueOk) {
    return trueHeading;
  }

  return null;
}

/**
 * expo-location heading `accuracy`:
 * - iOS: degrees of deviation (lower is better); negative = unreliable
 * - Android: calibration level 0–3 (higher is better); negative = uncalibrated
 *
 * Accept 0–25 so excellent iOS readings (including 0°) and Android tiers 1–3
 * pass, while large iOS deviation values are rejected.
 */
export function isTrueHeadingReliable(accuracy: number | null | undefined): boolean {
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy < 0) {
    return false;
  }

  return accuracy <= IOS_TRUE_HEADING_MAX_DEVIATION_DEG;
}

/** EMA weight for compass heading smoothing (display only). */
export const HEADING_EMA_ALPHA = 0.22;

/**
 * EMA-smooths a compass heading to reduce magnetometer jitter, correctly
 * handling the 0°/360° wrap-around (e.g. 359° → 2° is a +3° turn, not -357°).
 */
export function smoothHeadingEma(
  previous: number | null,
  next: number,
  alpha = HEADING_EMA_ALPHA,
): number {
  if (previous == null) {
    return next;
  }

  const rawDelta = next - previous;
  const shortestDelta = ((rawDelta + 180) % 360 + 360) % 360 - 180;
  return (previous + shortestDelta * alpha + 360) % 360;
}

/** EMA smooth a coordinate for live map display only. */
export function smoothCoordinateEma(
  previous: RouteCoordinate | null,
  next: RouteCoordinate,
  alpha = DISPLAY_COORDINATE_EMA_ALPHA,
): RouteCoordinate {
  if (!previous) {
    return next;
  }

  return [
    previous[0] * (1 - alpha) + next[0] * alpha,
    previous[1] * (1 - alpha) + next[1] * alpha,
  ];
}

function perpendicularDistanceMeters(
  point: RouteCoordinate,
  lineStart: RouteCoordinate,
  lineEnd: RouteCoordinate,
): number {
  const lineLengthMeters = deltaMetersBetween(lineStart, lineEnd);
  if (lineLengthMeters === 0) {
    return deltaMetersBetween(point, lineStart);
  }

  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) /
        ((x2 - x1) ** 2 + (y2 - y1) ** 2),
    ),
  );

  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);

  return deltaMetersBetween(point, [projX, projY]);
}

function douglasPeucker(
  coordinates: RouteCoordinate[],
  toleranceMeters: number,
): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  let maxDistance = 0;
  let maxIndex = 0;
  const endIndex = coordinates.length - 1;

  for (let index = 1; index < endIndex; index += 1) {
    const distance = perpendicularDistanceMeters(
      coordinates[index],
      coordinates[0],
      coordinates[endIndex],
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }

  if (maxDistance > toleranceMeters) {
    const left = douglasPeucker(coordinates.slice(0, maxIndex + 1), toleranceMeters);
    const right = douglasPeucker(coordinates.slice(maxIndex), toleranceMeters);
    return [...left.slice(0, -1), ...right];
  }

  return [coordinates[0], coordinates[endIndex]];
}

/** Remove isolated spikes before display simplification. */
function removeDisplayOutliers(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const filtered: RouteCoordinate[] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const prevRoutePoint = filtered[filtered.length - 1];
    const prevRoutePoint2 = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
    const current = coordinates[index];
    const next = coordinates[index + 1];

    if (prevRoutePoint2 && isSharpReversal(prevRoutePoint2, prevRoutePoint, current)) {
      continue;
    }

    const deviation = perpendicularDistanceMeters(current, prevRoutePoint, next);
    if (deviation > DISPLAY_SIMPLIFY_TOLERANCE_METERS * 2) {
      continue;
    }

    filtered.push(current);
  }

  filtered.push(coordinates[coordinates.length - 1]);
  return filtered;
}

/** Light 3-point weighted moving average for map display only. */
export function smoothRouteForDisplay(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const smoothed: RouteCoordinate[] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const prev = coordinates[index - 1];
    const current = coordinates[index];
    const next = coordinates[index + 1];

    smoothed.push([
      prev[0] * 0.25 + current[0] * 0.5 + next[0] * 0.25,
      prev[1] * 0.25 + current[1] * 0.5 + next[1] * 0.25,
    ]);
  }

  smoothed.push(coordinates[coordinates.length - 1]);
  return smoothed;
}

/** Full display pipeline: outlier removal → Douglas-Peucker → light smooth. */
export function simplifyRouteForDisplay(
  coordinates: RouteCoordinate[],
  toleranceMeters = DISPLAY_SIMPLIFY_TOLERANCE_METERS,
): RouteCoordinate[] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  const withoutOutliers = removeDisplayOutliers(coordinates);
  const simplified =
    withoutOutliers.length >= 3
      ? douglasPeucker(withoutOutliers, toleranceMeters)
      : withoutOutliers;

  return smoothRouteForDisplay(simplified);
}

export function deltaMetersBetween(from: RouteCoordinate, to: RouteCoordinate): number {
  return milesToMeters(
    haversineMiles(from[1], from[0], to[1], to[0]),
  );
}
