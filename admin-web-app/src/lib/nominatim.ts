/**
 * Real place names for the heatmap's neighborhood tooltips.
 * Browser calls `/api/place-reverse` (Photon → Nominatim on the server) — never hits
 * Nominatim directly from the client (User-Agent / CORS).
 *
 * Results are cached per `key` (e.g. tract GEOID). Prefer a small queue with hover
 * prioritization in the UI rather than flooding every tract in parallel.
 */

const cache = new Map<string, Promise<string | null>>();

/** Resolves a place name for `(latitude, longitude)`, cached per `key` (e.g. tract GEOID). */
export function reverseGeocodePlaceName(
  key: string,
  longitude: number,
  latitude: number,
): Promise<string | null> {
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const params = new URLSearchParams({
      lon: String(longitude),
      lat: String(latitude),
    });
    const res = await fetch(`/api/place-reverse?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { name?: string | null };
    return data.name?.trim() || null;
  })().catch(() => null);

  cache.set(key, promise);
  return promise;
}
