import {
  computeBearingDegrees,
  isAcceptableAccuracy,
  isPlausibleMovement,
  resolveHeading,
  smoothRouteForDisplay,
} from './routeFiltering';
import type { RouteCoordinate } from './geo';

describe('isAcceptableAccuracy', () => {
  it('accepts fixes within 20m', () => {
    expect(isAcceptableAccuracy(10)).toBe(true);
    expect(isAcceptableAccuracy(20)).toBe(true);
  });

  it('rejects poor or missing accuracy', () => {
    expect(isAcceptableAccuracy(25)).toBe(false);
    expect(isAcceptableAccuracy(null)).toBe(false);
    expect(isAcceptableAccuracy(undefined)).toBe(false);
  });
});

describe('isPlausibleMovement', () => {
  it('rejects impossible speeds', () => {
    expect(isPlausibleMovement(30, 1000)).toBe(false);
  });

  it('accepts walking pace', () => {
    expect(isPlausibleMovement(2, 1000)).toBe(true);
  });
});

describe('computeBearingDegrees', () => {
  it('returns east for a due-east segment', () => {
    const from: RouteCoordinate = [-87.63, 41.88];
    const to: RouteCoordinate = [-87.62, 41.88];
    const bearing = computeBearingDegrees(from, to);
    expect(bearing).toBeGreaterThan(85);
    expect(bearing).toBeLessThan(95);
  });
});

describe('resolveHeading', () => {
  it('prefers GPS heading when available', () => {
    expect(
      resolveHeading({
        heading: 45,
        previous: [-87.63, 41.88],
        current: [-87.62, 41.89],
      }),
    ).toBe(45);
  });

  it('falls back to movement bearing', () => {
    const heading = resolveHeading({
      heading: -1,
      previous: [-87.63, 41.88],
      current: [-87.62, 41.88],
    });
    expect(heading).not.toBeNull();
    expect(heading!).toBeGreaterThan(85);
    expect(heading!).toBeLessThan(95);
  });
});

describe('smoothRouteForDisplay', () => {
  it('preserves endpoints', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.625, 41.881],
      [-87.62, 41.882],
      [-87.615, 41.883],
    ];
    const smoothed = smoothRouteForDisplay(route);
    expect(smoothed[0]).toEqual(route[0]);
    expect(smoothed[smoothed.length - 1]).toEqual(route[route.length - 1]);
    expect(smoothed).toHaveLength(route.length);
  });

  it('returns short routes unchanged', () => {
    const route: RouteCoordinate[] = [[-87.63, 41.88], [-87.62, 41.89]];
    expect(smoothRouteForDisplay(route)).toEqual(route);
  });
});
