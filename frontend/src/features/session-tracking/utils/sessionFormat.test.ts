import {
  computeSessionDurationSeconds,
  formatDurationParts,
  formatRecentSessionDurationLabel,
  formatSessionDurationLabel,
  resolveSessionDurationSeconds,
} from './sessionFormat';

describe('computeSessionDurationSeconds', () => {
  it('returns seconds between timestamps', () => {
    const startedAt = Date.parse('2026-07-13T19:00:00');
    const endedAt = Date.parse('2026-07-13T19:05:00');
    expect(computeSessionDurationSeconds(startedAt, endedAt)).toBe(300);
  });

  it('never returns negative values', () => {
    expect(computeSessionDurationSeconds(1000, 500)).toBe(0);
  });
});

describe('resolveSessionDurationSeconds', () => {
  it('prefers wall-clock timestamps over elapsedSeconds', () => {
    const startedAt = Date.parse('2026-07-13T19:00:00');
    const endedAt = Date.parse('2026-07-13T19:05:00');

    expect(
      resolveSessionDurationSeconds({
        startedAt,
        endedAt,
        elapsedSeconds: 12,
      }),
    ).toBe(300);
  });

  it('falls back to elapsedSeconds when timestamps are missing', () => {
    expect(resolveSessionDurationSeconds({ elapsedSeconds: 90 })).toBe(90);
  });

  it('treats zero elapsedSeconds as valid', () => {
    expect(resolveSessionDurationSeconds({ elapsedSeconds: 0 })).toBe(0);
  });
});

describe('formatSessionDurationLabel', () => {
  it('formats a five-minute session', () => {
    expect(formatSessionDurationLabel(300)).toBe('5m');
  });

  it('rounds sub-minute sessions of at least 30 seconds up to 1m', () => {
    expect(formatSessionDurationLabel(45)).toBe('1m');
  });

  it('shows 0m for sessions under 30 seconds', () => {
    expect(formatSessionDurationLabel(20)).toBe('0m');
  });

  it('formats hours and minutes', () => {
    expect(formatSessionDurationLabel(5040)).toBe('1h 24m');
  });
});

describe('formatDurationParts', () => {
  it('splits hours and minutes', () => {
    expect(formatDurationParts(5040)).toEqual({ hours: 1, minutes: 24 });
  });
});

describe('formatRecentSessionDurationLabel', () => {
  it('formats decimal hours for home cards', () => {
    expect(formatRecentSessionDurationLabel(9000)).toBe('2.5 hrs');
  });

  it('shows 0.0 hrs for zero seconds', () => {
    expect(formatRecentSessionDurationLabel(0)).toBe('0.0 hrs');
  });
});
