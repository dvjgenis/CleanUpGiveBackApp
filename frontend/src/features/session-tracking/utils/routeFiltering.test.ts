import {
  computeBearingDegrees,
  getMinMovementMeters,
  isAcceptableAccuracy,
  isPlausibleMovement,
  isSharpReversal,
  isStationary,
  isTrueHeadingReliable,
  resolveCompassHeading,
  resolveHeading,
  shouldAppendRoutePoint,
  simplifyRouteForDisplay,
  smoothCoordinateEma,
  smoothHeadingEma,
  smoothRouteForDisplay,
  DISPLAY_COORDINATE_EMA_ALPHA,
} from './routeFiltering';
import type { RouteCoordinate } from './geo';

describe('isAcceptableAccuracy', () => {
  it('accepts fixes within 15m', () => {
    expect(isAcceptableAccuracy(10)).toBe(true);
    expect(isAcceptableAccuracy(15)).toBe(true);
  });

  it('rejects poor or missing accuracy', () => {
    expect(isAcceptableAccuracy(16)).toBe(false);
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

describe('getMinMovementMeters', () => {
  it('uses at least MIN_ROUTE_SAMPLE_METERS', () => {
    expect(getMinMovementMeters(5)).toBe(6);
  });

  it('scales with reported accuracy', () => {
    expect(getMinMovementMeters(20)).toBe(12);
  });
});

describe('isStationary', () => {
  it('rejects append when device speed is near zero and movement is small', () => {
    expect(
      isStationary({
        speedMps: 0,
        deltaMeters: 4,
        deltaMs: 2000,
        minMovementMeters: 6,
      }),
    ).toBe(true);
  });

  it('allows movement when speed indicates walking', () => {
    expect(
      isStationary({
        speedMps: 1.2,
        deltaMeters: 8,
        deltaMs: 2000,
        minMovementMeters: 6,
      }),
    ).toBe(false);
  });
});

describe('isSharpReversal', () => {
  it('rejects a short backtrack segment', () => {
    const a: RouteCoordinate = [-87.63, 41.88];
    const b: RouteCoordinate = [-87.62999, 41.88];
    const c: RouteCoordinate = [-87.63, 41.88];
    expect(isSharpReversal(a, b, c)).toBe(true);
  });

  it('allows gradual turns over longer segments', () => {
    const a: RouteCoordinate = [-87.63, 41.88];
    const b: RouteCoordinate = [-87.62, 41.88];
    const c: RouteCoordinate = [-87.61, 41.89];
    expect(isSharpReversal(a, b, c)).toBe(false);
  });
});

describe('shouldAppendRoutePoint', () => {
  const lastRoute: RouteCoordinate = [-87.63, 41.88];
  const prevRoute: RouteCoordinate = [-87.631, 41.88];
  const sessionStartedAt = 1_000_000;

  it('rejects during GPS warm-up', () => {
    expect(
      shouldAppendRoutePoint({
        lastRoutePoint: lastRoute,
        prevRoutePoint: prevRoute,
        candidate: [-87.62, 41.88],
        accuracyMeters: 8,
        speedMps: 1.5,
        deltaMetersFromRoute: 10,
        deltaMetersFromLastFix: 10,
        deltaMs: 2000,
        sessionStartedAt,
        sampleTimestamp: sessionStartedAt + 3000,
      }),
    ).toBe(false);
  });

  it('rejects when movement from last route point is too small', () => {
    expect(
      shouldAppendRoutePoint({
        lastRoutePoint: lastRoute,
        prevRoutePoint: prevRoute,
        candidate: [-87.6299, 41.88],
        accuracyMeters: 8,
        speedMps: 1.5,
        deltaMetersFromRoute: 4,
        deltaMetersFromLastFix: 4,
        deltaMs: 2000,
        sessionStartedAt,
        sampleTimestamp: sessionStartedAt + 10_000,
      }),
    ).toBe(false);
  });

  it('accepts valid walking movement after warm-up', () => {
    expect(
      shouldAppendRoutePoint({
        lastRoutePoint: lastRoute,
        prevRoutePoint: prevRoute,
        candidate: [-87.62, 41.88],
        accuracyMeters: 8,
        speedMps: 1.5,
        deltaMetersFromRoute: 10,
        deltaMetersFromLastFix: 10,
        deltaMs: 2000,
        sessionStartedAt,
        sampleTimestamp: sessionStartedAt + 10_000,
      }),
    ).toBe(true);
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

describe('resolveCompassHeading', () => {
  it('prefers true-north heading when valid and accurate', () => {
    expect(
      resolveCompassHeading({ trueHeading: 120, magHeading: 118, accuracy: 10 }),
    ).toBe(120);
  });

  it('falls back to magnetic heading when true heading is unavailable', () => {
    expect(resolveCompassHeading({ trueHeading: -1, magHeading: 200 })).toBe(200);
  });

  it('falls back to magnetic when true-heading accuracy is poor', () => {
    expect(
      resolveCompassHeading({ trueHeading: 90, magHeading: 100, accuracy: 45 }),
    ).toBe(100);
  });

  it('returns null when neither reading is valid', () => {
    expect(resolveCompassHeading({ trueHeading: -1, magHeading: -1 })).toBeNull();
  });
});

describe('isTrueHeadingReliable', () => {
  it('rejects negative or missing accuracy', () => {
    expect(isTrueHeadingReliable(-1)).toBe(false);
    expect(isTrueHeadingReliable(null)).toBe(false);
  });

  it('accepts low deviation / calibration values', () => {
    expect(isTrueHeadingReliable(0)).toBe(true);
    expect(isTrueHeadingReliable(12)).toBe(true);
  });

  it('rejects large deviation values', () => {
    expect(isTrueHeadingReliable(45)).toBe(false);
  });
});

describe('smoothHeadingEma', () => {
  it('returns the next heading when no previous value exists', () => {
    expect(smoothHeadingEma(null, 90)).toBe(90);
  });

  it('eases toward the next heading', () => {
    const smoothed = smoothHeadingEma(0, 90, 0.5);
    expect(smoothed).toBeCloseTo(45);
  });

  it('takes the shortest path across the 0°/360° wrap-around', () => {
    const smoothed = smoothHeadingEma(359, 2, 0.5);
    expect(smoothed).toBeCloseTo(0.5, 1);
  });
});

describe('smoothCoordinateEma', () => {
  it('returns the next coordinate when no previous value exists', () => {
    const next: RouteCoordinate = [-87.63, 41.88];
    expect(smoothCoordinateEma(null, next)).toEqual(next);
  });

  it('moves toward the next coordinate', () => {
    const prev: RouteCoordinate = [-87.63, 41.88];
    const next: RouteCoordinate = [-87.62, 41.89];
    const smoothed = smoothCoordinateEma(prev, next, DISPLAY_COORDINATE_EMA_ALPHA);
    expect(smoothed[0]).toBeGreaterThan(prev[0]);
    expect(smoothed[0]).toBeLessThan(next[0]);
    expect(smoothed[1]).toBeGreaterThan(prev[1]);
    expect(smoothed[1]).toBeLessThan(next[1]);
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

describe('simplifyRouteForDisplay', () => {
  it('preserves endpoints and reduces noisy zigzag points', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.629, 41.8801],
      [-87.63, 41.8799],
      [-87.629, 41.88],
      [-87.62, 41.88],
    ];
    const simplified = simplifyRouteForDisplay(route);
    expect(simplified[0]).toEqual(route[0]);
    expect(simplified[simplified.length - 1]).toEqual(route[route.length - 1]);
    expect(simplified.length).toBeLessThan(route.length);
  });
});
