import {
  buildWeeklyHoursChart,
  formatChartHourLabel,
  formatWeekServiceHoursTotal,
  type SessionStatRecord,
} from './homeDashboardStats';

const MONDAY_JULY_13_2026 = '2026-07-13';

function stat(
  overrides: Partial<SessionStatRecord> & Pick<SessionStatRecord, 'id' | 'startedAtMs' | 'durationSeconds'>,
): SessionStatRecord {
  return {
    distanceMiles: 0,
    photoCount: 0,
    locationLabel: 'Park',
    status: 'pending',
    ...overrides,
  };
}

describe('buildWeeklyHoursChart', () => {
  it('buckets completed sessions into hour values by weekday', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
      }),
    ];

    const chart = buildWeeklyHoursChart(stats, MONDAY_JULY_13_2026);

    expect(chart.find((day) => day.day === 'Tue')?.value).toBe(1.5);
    expect(chart.find((day) => day.day === 'Thu')?.value).toBe(0.5);
    expect(chart.find((day) => day.day === 'Mon')?.value).toBe(0);
  });

  it('excludes declined sessions and other weeks', () => {
    const stats = [
      stat({
        id: 'declined',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 3600,
        status: 'declined',
      }),
      stat({
        id: 'other-week',
        startedAtMs: Date.parse('2026-07-07T10:00:00'),
        durationSeconds: 3600,
      }),
    ];

    const chart = buildWeeklyHoursChart(stats, MONDAY_JULY_13_2026);
    expect(chart.every((day) => day.value === 0)).toBe(true);
  });
});

describe('formatWeekServiceHoursTotal', () => {
  it('sums chart hours for the selected week', () => {
    const stats = [
      stat({
        id: 's1',
        startedAtMs: Date.parse('2026-07-14T10:00:00'),
        durationSeconds: 5400,
      }),
      stat({
        id: 's2',
        startedAtMs: Date.parse('2026-07-16T15:00:00'),
        durationSeconds: 1800,
      }),
    ];

    expect(formatWeekServiceHoursTotal(stats, MONDAY_JULY_13_2026)).toBe('2.0 hrs');
  });
});

describe('formatChartHourLabel', () => {
  it('formats whole and fractional hours', () => {
    expect(formatChartHourLabel(2)).toBe('2');
    expect(formatChartHourLabel(1.5)).toBe('1.5');
    expect(formatChartHourLabel(0)).toBe('0');
  });
});
