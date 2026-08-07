/**
 * Real place names for the heatmap's neighborhood tooltips, via OpenStreetMap's free
 * Nominatim reverse-geocoding API. Census tracts (see `census-tracts.ts`) only carry
 * administrative IDs like "Census Tract 8080.01" — this resolves an actual colloquial
 * name ("Evanston", "Rogers Park", ...) for a given point.
 *
 * Nominatim's usage policy caps this at ~1 request/second — only call it for a small,
 * known set of points (e.g. tracts with real session activity), never per-hover across
 * an entire county's tract set.
 */
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const MIN_REQUEST_GAP_MS = 1100;

const cache = new Map<string, Promise<string | null>>();
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

type NominatimAddress = {
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  village?: string;
  hamlet?: string;
  town?: string;
};

/** Resolves a place name for `(latitude, longitude)`, cached per `key` (e.g. tract GEOID). */
export function reverseGeocodePlaceName(key: string, longitude: number, latitude: number): Promise<string | null> {
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    await throttle();
    const url = `${REVERSE_URL}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    const address = data.address ?? {};
    return (
      address.neighbourhood ??
      address.suburb ??
      address.quarter ??
      address.city_district ??
      address.village ??
      address.town ??
      address.hamlet ??
      null
    );
  })().catch(() => null);

  cache.set(key, promise);
  return promise;
}

export type PlaceSearchResult = { longitude: number; latitude: number; label: string };

/**
 * Forward geocode — free-text address/place search for the county map's search bar.
 * `viewboxBounds` (a `[minLng, minLat, maxLng, maxLat]` tuple) biases results toward the
 * drilled-into county without excluding matches outside it (`bounded=0`).
 */
export async function searchPlace(
  query: string,
  viewboxBounds?: [number, number, number, number],
): Promise<PlaceSearchResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  await throttle();
  const params = new URLSearchParams({ format: 'jsonv2', q: trimmed, limit: '1' });
  if (viewboxBounds) {
    const [minLng, minLat, maxLng, maxLat] = viewboxBounds;
    params.set('viewbox', `${minLng},${maxLat},${maxLng},${minLat}`);
    params.set('bounded', '0');
  }
  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const top = results[0];
  if (!top) return null;
  return { longitude: Number(top.lon), latitude: Number(top.lat), label: top.display_name };
}
