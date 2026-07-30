/**
 * Parse `sessions.route` jsonb (`[[lng, lat], …]`) into MapLibre-ready coords.
 * Mirrors mobile `toRouteCoordinates` / Fly letterhead `parseRoute`.
 */

export type RouteCoordinate = [number, number];

export function parseSessionRoute(route: unknown): RouteCoordinate[] {
  if (!Array.isArray(route)) return [];

  const coords: RouteCoordinate[] = [];
  for (const point of route) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    coords.push([lng, lat]);
  }
  return coords;
}

export function routeBounds(coords: RouteCoordinate[]): {
  sw: RouteCoordinate;
  ne: RouteCoordinate;
} | null {
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { sw: [minLng, minLat], ne: [maxLng, maxLat] };
}
