import {
  computeBearingDegrees,
  getMinMovementMeters,
  headingEmaAlpha,
  isAcceptableAccuracy,
  isCompassReadingUsable,
  isPlausibleMovement,
  isSharpReversal,
  isStationary,
  isTrueHeadingReliable,
  resolveCompassHeading,
  resolveHeading,
  shouldAppendRoutePoint,
  shouldSkipDuplicateLocationSample,
  simplifyRouteForDisplay,
  simplifyRouteForLiveDisplay,
  sliceRouteByDistanceProgress,
  smoothCoordinateEma,
  smoothHeadingEma,
  smoothRouteForDisplay,
  DISPLAY_COORDINATE_EMA_ALPHA,
  HEADING_EMA_ALPHA_MAX,
  HEADING_EMA_ALPHA_MIN,
} from './routeFiltering';
import type { RouteCoordinate } from './geo';

describe('isAcceptableAccuracy', () => {
  it('accepts fixes within 25m', () => {
    expect(isAcceptableAccuracy(10)).toBe(true);
    expect(isAcceptableAccuracy(25)).toBe(true);
  });

  it('rejects poor accuracy', () => {
    expect(isAcceptableAccuracy(26)).toBe(false);
  });

  it('allows missing accuracy for Kalman default trust', () => {
    expect(isAcceptableAccuracy(null)).toBe(true);
    expect(isAcceptableAccuracy(undefined)).toBe(true);
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
    expect(getMinMovementMeters(5)).toBe(1.25);
  });

  it('scales with reported accuracy', () => {
    expect(getMinMovementMeters(20)).toBe(5);
  });
});

describe('isStationary', () => {
  it('rejects append when positive near-zero speed and movement is small', () => {
    expect(
      isStationary({
        speedMps: 0.05,
        deltaMeters: 4,
        deltaMs: 2000,
        minMovementMeters: 6,
      }),
    ).toBe(true);
  });

  it('does not treat speedMps === 0 alone as stationary when movement is clear', () => {
    // Phones often report 0 while walking; rely on implied speed instead.
    expect(
      isStationary({
        speedMps: 0,
        deltaMeters: 4,
        deltaMs: 2000,
        minMovementMeters: 1,
      }),
    ).toBe(false);
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
        sampleTimestamp: sessionStartedAt + 2000,
        lastRouteAppendTimestamp: sessionStartedAt + 1000,
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
        deltaMetersFromRoute: 1,
        deltaMetersFromLastFix: 1,
        deltaMs: 2000,
        sessionStartedAt,
        sampleTimestamp: sessionStartedAt + 10_000,
        lastRouteAppendTimestamp: sessionStartedAt + 9_000,
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
        lastRouteAppendTimestamp: sessionStartedAt + 9_000,
      }),
    ).toBe(true);
  });

  it('accepts slow cleanup walking speed after warm-up', () => {
    expect(
      shouldAppendRoutePoint({
        lastRoutePoint: lastRoute,
        prevRoutePoint: prevRoute,
        candidate: [-87.62, 41.88],
        accuracyMeters: 8,
        speedMps: 0.15,
        deltaMetersFromRoute: 4,
        deltaMetersFromLastFix: 4,
        deltaMs: 4000,
        sessionStartedAt,
        sampleTimestamp: sessionStartedAt + 10_000,
        lastRouteAppendTimestamp: sessionStartedAt + 5_000,
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
    const heading = resolveHeading({
      heading: 45,
      previous: [-87.63, 41.88],
      current: [-87.62, 41.89],
    });
    expect(heading).not.toBeNull();
    expect(heading!).toBeGreaterThan(40);
    expect(heading!).toBeLessThan(50);
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

  it('falls back to magnetic when true-heading accuracy is poor but usable', () => {
    expect(
      resolveCompassHeading({ trueHeading: 90, magHeading: 100, accuracy: 22 }),
    ).toBe(100);
  });

  it('returns null when sensor accuracy indicates interference', () => {
    expect(
      resolveCompassHeading({ trueHeading: 90, magHeading: 100, accuracy: 45 }),
    ).toBeNull();
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
    expect(isTrueHeadingReliable(20)).toBe(false);
    expect(isTrueHeadingReliable(45)).toBe(false);
  });

  it('requires medium+ Android calibration for true-north', () => {
    expect(isTrueHeadingReliable(0, 'android')).toBe(false);
    expect(isTrueHeadingReliable(1, 'android')).toBe(false);
    expect(isTrueHeadingReliable(2, 'android')).toBe(true);
    expect(isTrueHeadingReliable(3, 'android')).toBe(true);
  });
});

describe('isCompassReadingUsable', () => {
  it('allows unknown accuracy', () => {
    expect(isCompassReadingUsable(null)).toBe(true);
    expect(isCompassReadingUsable(undefined)).toBe(true);
  });

  it('rejects negative accuracy', () => {
    expect(isCompassReadingUsable(-1)).toBe(false);
  });

  it('rejects severe iOS deviation', () => {
    expect(isCompassReadingUsable(45)).toBe(false);
    expect(isCompassReadingUsable(30)).toBe(true);
  });

  it('rejects Android uncalibrated (0) readings', () => {
    expect(isCompassReadingUsable(0, 'android')).toBe(false);
    expect(isCompassReadingUsable(1, 'android')).toBe(true);
  });
});

describe('headingEmaAlpha', () => {
  it('uses the slow alpha for tiny turns', () => {
    expect(headingEmaAlpha(1)).toBe(HEADING_EMA_ALPHA_MIN);
  });

  it('uses the fast alpha for large turns', () => {
    expect(headingEmaAlpha(50)).toBe(HEADING_EMA_ALPHA_MAX);
  });

  it('interpolates mid-size turns', () => {
    const mid = headingEmaAlpha(20);
    expect(mid).toBeGreaterThan(HEADING_EMA_ALPHA_MIN);
    expect(mid).toBeLessThan(HEADING_EMA_ALPHA_MAX);
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

  it('adapts alpha so large turns catch up faster than tiny noise', () => {
    const afterNoise = smoothHeadingEma(0, 2);
    const afterTurn = smoothHeadingEma(0, 90);
    expect(afterNoise).toBeLessThan(2);
    expect(afterTurn).toBeGreaterThan(afterNoise * 10);
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

describe('simplifyRouteForLiveDisplay', () => {
  it('retains more points than 4m preview simplify on a long path', () => {
    const route: RouteCoordinate[] = [];
    for (let i = 0; i <= 20; i += 1) {
      route.push([-87.63 + i * 0.00005, 41.88 + (i % 2 === 0 ? 0.00002 : -0.00002)]);
    }
    const preview = simplifyRouteForDisplay(route);
    const live = simplifyRouteForLiveDisplay(route);
    expect(live.length).toBeGreaterThan(preview.length);
    expect(live[0]).toEqual(route[0]);
    expect(live[live.length - 1]).toEqual(route[route.length - 1]);
  });
});

describe('sliceRouteByDistanceProgress', () => {
  it('returns start point at progress 0', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.62, 41.88],
      [-87.61, 41.88],
    ];
    expect(sliceRouteByDistanceProgress(route, 0)).toEqual([route[0]]);
  });

  it('returns full route at progress 1', () => {
    const route: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.62, 41.88],
      [-87.61, 41.88],
    ];
    expect(sliceRouteByDistanceProgress(route, 1)).toEqual(route);
  });

  it('interpolates tip at half distance rather than half index', () => {
    const dense: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.6299, 41.8801],
      [-87.6298, 41.8799],
      [-87.62, 41.88],
    ];
    const sparse: RouteCoordinate[] = [
      [-87.63, 41.88],
      [-87.62, 41.88],
    ];

    const denseHalf = sliceRouteByDistanceProgress(dense, 0.5);
    const sparseHalf = sliceRouteByDistanceProgress(sparse, 0.5);

    expect(denseHalf.length).toBeGreaterThan(1);
    expect(sparseHalf.length).toBe(2);
    expect(sparseHalf[1][0]).toBeCloseTo(-87.625, 3);
  });
});

describe('shouldSkipDuplicateLocationSample', () => {
  const base: RouteCoordinate = [-87.6298, 41.8781];

  it('skips older timestamps', () => {
    expect(
      shouldSkipDuplicateLocationSample({
        sampleTimestampMs: 1000,
        coordinate: base,
        lastProcessedTimestampMs: 1000,
        lastProcessedCoordinate: base,
      }),
    ).toBe(true);
  });

  it('skips near-duplicate fixes inside the window', () => {
    expect(
      shouldSkipDuplicateLocationSample({
        sampleTimestampMs: 1200,
        coordinate: [-87.62981, 41.87811],
        lastProcessedTimestampMs: 1000,
        lastProcessedCoordinate: base,
      }),
    ).toBe(true);
  });

  it('allows distinct fixes after the window', () => {
    expect(
      shouldSkipDuplicateLocationSample({
        sampleTimestampMs: 2000,
        coordinate: [-87.63, 41.879],
        lastProcessedTimestampMs: 1000,
        lastProcessedCoordinate: base,
      }),
    ).toBe(false);
  });
});
