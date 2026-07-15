import { haversineMiles, milesToMeters, type RouteCoordinate } from './geo';

/** Reject fixes with horizontal accuracy worse than this (meters). */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 20;

/** Reject implied speeds above this when appending route points (m/s). */
export const MAX_PLAUSIBLE_SPEED_MPS = 8;

export function isAcceptableAccuracy(accuracyMeters: number | null | undefined): boolean {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters)) {
    return false;
  }

  return accuracyMeters > 0 && accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

export function isPlausibleMovement(deltaMeters: number, deltaMs: number): boolean {
  if (deltaMs <= 0) {
    return deltaMeters === 0;
  }

  const speedMps = deltaMeters / (deltaMs / 1000);
  return speedMps <= MAX_PLAUSIBLE_SPEED_MPS;
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

/** Prefer GPS heading when valid; otherwise derive from last movement. */
export function resolveHeading({ heading, previous, current }: HeadingInput): number | null {
  if (heading != null && Number.isFinite(heading) && heading >= 0) {
    return heading;
  }

  if (!previous) {
    return null;
  }

  return computeBearingDegrees(previous, current);
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

export function deltaMetersBetween(from: RouteCoordinate, to: RouteCoordinate): number {
  return milesToMeters(
    haversineMiles(from[1], from[0], to[1], to[0]),
  );
}
