/**
 * Free place search chain for admin maps: Photon first, Nominatim backup.
 * No Google dependency. Prefer calling from `/api/place-search` (server) so
 * Nominatim gets a proper User-Agent and browser CORS is not a blocker.
 */

import { searchPhoton, type PhotonHit } from "@/lib/photon";

export type PlaceHit = PhotonHit;

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const UA = "CleanUpGiveBackAdmin/1.0 (heatmap place search)";

/** Shared bias helper — viewport center from `[minLng, minLat, maxLng, maxLat]`. */
export function biasFromViewbox(
  viewboxBounds?: [number, number, number, number],
): { latitude: number; longitude: number } | undefined {
  if (!viewboxBounds) return undefined;
  const [minLng, minLat, maxLng, maxLat] = viewboxBounds;
  return {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2,
  };
}

async function searchNominatimMany(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    viewboxBounds?: [number, number, number, number];
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<PlaceHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = opts?.limit ?? 6;
  const params = new URLSearchParams({
    format: "jsonv2",
    q: trimmed,
    limit: String(limit),
    addressdetails: "0",
    countrycodes: "us",
  });
  if (opts?.viewboxBounds) {
    const [minLng, minLat, maxLng, maxLat] = opts.viewboxBounds;
    params.set("viewbox", `${minLng},${maxLat},${maxLng},${minLat}`);
    params.set("bounded", "0");
  }

  const res = await fetch(`${NOMINATIM_SEARCH}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: opts?.signal,
  });
  if (!res.ok) return [];

  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return results
    .map((r) => ({
      label: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }))
    .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude) && h.label);
}

/**
 * Typeahead / resolve: Photon → Nominatim. Returns up to `limit` hits.
 * Never throws — empty array on total failure.
 */
export async function searchPlacesFree(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    viewboxBounds?: [number, number, number, number];
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<{ hits: PlaceHit[]; source: "photon" | "nominatim" | "none" }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { hits: [], source: "none" };
  const limit = opts?.limit ?? 6;

  try {
    const photonHits = await searchPhoton(trimmed, {
      bias: opts?.bias,
      limit,
      signal: opts?.signal,
    });
    if (photonHits.length > 0) return { hits: photonHits, source: "photon" };
  } catch {
    // fall through to Nominatim
  }

  if (opts?.signal?.aborted) return { hits: [], source: "none" };

  try {
    const nominatimHits = await searchNominatimMany(trimmed, {
      bias: opts?.bias,
      viewboxBounds: opts?.viewboxBounds,
      limit,
      signal: opts?.signal,
    });
    if (nominatimHits.length > 0) return { hits: nominatimHits, source: "nominatim" };
  } catch {
    // total miss
  }

  return { hits: [], source: "none" };
}

/** Single best place for Search / Enter — Photon top hit, else Nominatim. */
export async function resolvePlaceFree(
  query: string,
  opts?: {
    bias?: { latitude: number; longitude: number };
    viewboxBounds?: [number, number, number, number];
    signal?: AbortSignal;
  },
): Promise<PlaceHit | null> {
  const { hits } = await searchPlacesFree(query, { ...opts, limit: 1 });
  return hits[0] ?? null;
}
