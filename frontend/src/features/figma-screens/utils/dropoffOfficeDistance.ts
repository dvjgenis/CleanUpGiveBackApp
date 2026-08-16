import {
  CLEAN_UP_GIVE_BACK_LOCATION,
  MAX_LOCAL_DROPOFF_MILES,
} from '@/constants/orgLocations';
import {
  geocodeAddressQuery,
  type AddressSuggestion,
} from '@/lib/geocodeAddress';
import { haversineMiles } from '@/features/session-tracking/utils/geo';

export type DropoffAddressFields = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export function buildDropoffAddressQuery(fields: DropoffAddressFields): string | null {
  const street = fields.street.trim();
  const city = fields.city.trim();
  const state = fields.state.trim();
  const zip = fields.zip.trim();
  if (!street || !city || !zip) return null;
  const statePart = state ? `${state} ` : '';
  return `${street}, ${city}, ${statePart}${zip}, US`;
}

export function uniqueSuggestionValues(
  hits: AddressSuggestion[],
  key: 'city' | 'state' | 'zip',
): string[] {
  return uniqueStrings(hits.map((hit) => hit[key]), key === 'state');
}

export function uniqueStrings(values: string[], uppercase = false): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const raw = value.trim();
    if (!raw) continue;
    const id = raw.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(uppercase ? raw.toUpperCase() : raw);
  }
  return out;
}

export function formatMilesFromOffice(miles: number): string {
  if (miles < 0.1) return 'Less than 0.1 mi from Clean Up Give Back';
  if (miles < 10) return `About ${miles.toFixed(1)} mi from Clean Up Give Back`;
  return `About ${Math.round(miles)} mi from Clean Up Give Back`;
}

export function isDropoffTooFar(miles: number): boolean {
  return miles > MAX_LOCAL_DROPOFF_MILES;
}

export async function resolveDropoffDistanceMiles(
  query: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const hit = await geocodeAddressQuery(query, {
    bias: {
      latitude: CLEAN_UP_GIVE_BACK_LOCATION.latitude,
      longitude: CLEAN_UP_GIVE_BACK_LOCATION.longitude,
    },
    signal,
  });
  if (!hit) return null;

  return haversineMiles(
    CLEAN_UP_GIVE_BACK_LOCATION.latitude,
    CLEAN_UP_GIVE_BACK_LOCATION.longitude,
    hit.latitude,
    hit.longitude,
  );
}
