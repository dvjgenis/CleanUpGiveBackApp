/**
 * Census tract boundaries for the heatmap's county drill-down — real geography for
 * every US county (not just Chicago), from the Census Bureau's public TIGERweb REST
 * API. Uses the "Generalized_ACS2023" service (500k cartographic boundaries, Douglas–
 * Peucker simplified) instead of full-resolution TIGER/Line — ~8x smaller payload,
 * same free/no-key access.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type TractFeature = Feature<Geometry, { GEOID: string; NAME: string }>;

const TRACTS_LAYER_URL =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2023/Tracts_Blocks/MapServer/4/query';

const tractsCache = new Map<string, Promise<FeatureCollection>>();

/** 5-digit county FIPS → its 3-digit county code (state prefix stripped). */
export function countyCodeFromFips(countyFips: string): string {
  return countyFips.slice(2);
}

/**
 * Loads every census tract in a county as GeoJSON, cached per (state, county) pair
 * for the life of the page. Tracts partition the *entire* county — suburbs and
 * unincorporated areas included, not just a city's official neighborhoods.
 */
export function loadCountyTracts(stateFips: string, countyFips: string): Promise<FeatureCollection> {
  const key = `${stateFips}-${countyFips}`;
  const cached = tractsCache.get(key);
  if (cached) return cached;

  const countyCode = countyCodeFromFips(countyFips);
  const where = encodeURIComponent(`STATE='${stateFips}' AND COUNTY='${countyCode}'`);
  const url = `${TRACTS_LAYER_URL}?where=${where}&outFields=GEOID,NAME&f=geojson&outSR=4326`;

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load census tracts (${res.status})`);
      return res.json() as Promise<FeatureCollection>;
    })
    .catch((err) => {
      tractsCache.delete(key);
      throw err;
    });

  tractsCache.set(key, promise);
  return promise;
}
