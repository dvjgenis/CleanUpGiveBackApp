import {
  createLocationKalmanFilter,
  resetLocationKalmanFilter,
  updateLocationKalman,
} from './locationKalman';

describe('locationKalman', () => {
  it('initializes on the first sample', () => {
    const filter = createLocationKalmanFilter();
    const coordinate = updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    expect(coordinate).toEqual([-87.63, 41.88]);
    expect(filter.initialized).toBe(true);
  });

  it('smooths noisy measurements toward motion', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    const next = updateLocationKalman(filter, {
      latitude: 41.88005,
      longitude: -87.62995,
      accuracyMeters: 8,
      timestampMs: 2_000,
    });

    expect(next[0]).toBeGreaterThan(-87.63);
    expect(next[1]).toBeGreaterThan(41.88);
  });

  it('resets cleanly', () => {
    const filter = createLocationKalmanFilter();
    updateLocationKalman(filter, {
      latitude: 41.88,
      longitude: -87.63,
      accuracyMeters: 8,
      timestampMs: 1_000,
    });

    resetLocationKalmanFilter(filter);
    expect(filter.initialized).toBe(false);
  });
});
