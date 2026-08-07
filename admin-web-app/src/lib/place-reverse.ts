/**
 * Reverse geocode → colloquial place name (neighbourhood / suburb / …) for heatmap
 * tract tooltips. Photon first (generous), Nominatim fallback (rate-limited).
 * Call from `/api/place-reverse` so User-Agent / CORS stay on the server.
 */

const PHOTON_REVERSE = "https://photon.komoot.io/reverse";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const UA = "CleanUpGiveBackAdmin/1.0 (heatmap tract place names)";
const NOMINATIM_MIN_GAP_MS = 1100;

let lastNominatimAt = 0;

async function throttleNominatim(): Promise<void> {
  const wait = lastNominatimAt + NOMINATIM_MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimAt = Date.now();
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

type PhotonProps = {
  name?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  locality?: string;
  osm_key?: string;
  osm_value?: string;
};

/** Prefer neighbourhood-ish OSM tags; skip bare city names that aren't useful as tract labels. */
function nameFromPhoton(props: PhotonProps | undefined): string | null {
  if (!props?.name?.trim()) return null;
  const value = (props.osm_value ?? "").toLowerCase();
  const key = (props.osm_key ?? "").toLowerCase();
  const neighbourhoodish =
    value === "neighbourhood" ||
    value === "neighborhood" ||
    value === "suburb" ||
    value === "quarter" ||
    value === "city_district" ||
    value === "district" ||
    value === "borough" ||
    value === "residential" ||
    key === "place";
  if (neighbourhoodish) return props.name.trim();
  // Photon sometimes returns a named place without a helpful osm_value — use it if it
  // isn't just repeating the city/town.
  const locality = props.city ?? props.town ?? props.village;
  if (locality && props.name.trim().toLowerCase() === locality.trim().toLowerCase()) {
    return null;
  }
  return props.name.trim();
}

async function reversePhoton(longitude: number, latitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    lon: String(longitude),
    lat: String(latitude),
    lang: "en",
  });
  const res = await fetch(`${PHOTON_REVERSE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: { properties?: PhotonProps }[] };
  return nameFromPhoton(data.features?.[0]?.properties);
}

async function reverseNominatim(longitude: number, latitude: number): Promise<string | null> {
  await throttleNominatim();
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "16",
    addressdetails: "1",
  });
  const res = await fetch(`${NOMINATIM_REVERSE}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(5000),
  });
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
}

/**
 * Resolves a colloquial place name for a point. Never throws — returns null on miss.
 */
export async function reversePlaceName(
  longitude: number,
  latitude: number,
): Promise<{ name: string | null; source: "photon" | "nominatim" | "none" }> {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return { name: null, source: "none" };
  }

  try {
    const photonName = await reversePhoton(longitude, latitude);
    if (photonName) return { name: photonName, source: "photon" };
  } catch (err) {
    console.error("[place-reverse] photon failed:", err instanceof Error ? err.message : err);
  }

  try {
    const nominatimName = await reverseNominatim(longitude, latitude);
    if (nominatimName) return { name: nominatimName, source: "nominatim" };
  } catch (err) {
    console.error("[place-reverse] nominatim failed:", err instanceof Error ? err.message : err);
  }

  return { name: null, source: "none" };
}
