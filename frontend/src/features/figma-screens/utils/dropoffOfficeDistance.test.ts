import type { AddressSuggestion } from '@/lib/geocodeAddress';
import { normalizeUsState } from '@/lib/geocodeAddress';
import {
  buildDropoffAddressQuery,
  formatMilesFromOffice,
  isDropoffTooFar,
  uniqueStrings,
  uniqueSuggestionValues,
} from './dropoffOfficeDistance';

const sampleHits: AddressSuggestion[] = [
  {
    label: '123 Main St, Evanston, IL 60201',
    street: '123 Main St',
    city: 'Evanston',
    state: 'IL',
    zip: '60201',
    latitude: 42.04,
    longitude: -87.68,
  },
  {
    label: '123 Main St, Skokie, IL 60077',
    street: '123 Main St',
    city: 'Skokie',
    state: 'IL',
    zip: '60077',
    latitude: 42.03,
    longitude: -87.73,
  },
];

describe('dropoffOfficeDistance', () => {
  it('builds a geocode query when required fields are present', () => {
    expect(
      buildDropoffAddressQuery({
        street: '123 Main St',
        city: 'Evanston',
        state: 'IL',
        zip: '60201',
      }),
    ).toBe('123 Main St, Evanston, IL 60201, US');
  });

  it('returns null when street, city, or zip is missing', () => {
    expect(
      buildDropoffAddressQuery({
        street: '',
        city: 'Evanston',
        state: 'IL',
        zip: '60201',
      }),
    ).toBeNull();
  });

  it('formats short and long distances from the office', () => {
    expect(formatMilesFromOffice(0.05)).toBe('Less than 0.1 mi from Clean Up Give Back');
    expect(formatMilesFromOffice(4.2)).toBe('About 4.2 mi from Clean Up Give Back');
    expect(formatMilesFromOffice(18.6)).toBe('About 19 mi from Clean Up Give Back');
  });

  it('normalizes full state names to abbreviations', () => {
    expect(normalizeUsState('Illinois')).toBe('IL');
    expect(normalizeUsState('il')).toBe('IL');
  });

  it('lists unique cities and zips from suggestions', () => {
    expect(uniqueSuggestionValues(sampleHits, 'city')).toEqual(['Evanston', 'Skokie']);
    expect(uniqueSuggestionValues(sampleHits, 'state')).toEqual(['IL']);
    expect(uniqueSuggestionValues(sampleHits, 'zip')).toEqual(['60201', '60077']);
  });

  it('dedupes mixed city lists case-insensitively', () => {
    expect(uniqueStrings(['Evanston', 'evanston', 'Skokie'])).toEqual(['Evanston', 'Skokie']);
  });

  it('flags drop-off more than 30 miles from the office', () => {
    expect(isDropoffTooFar(30)).toBe(false);
    expect(isDropoffTooFar(30.1)).toBe(true);
  });
});
