import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  isWithinInterval,
  parseISO,
} from 'date-fns';

export type DashboardPeriod = 'month' | '30d' | 'all';

export function parsePeriod(raw: string | string[] | undefined): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '30d' || value === 'all' || value === 'month') return value;
  return 'month';
}

export function periodLabel(period: DashboardPeriod, now = new Date()): string {
  switch (period) {
    case 'month':
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case '30d':
      return 'Last 30 days';
    case 'all':
      return 'All time';
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export function periodInterval(
  period: DashboardPeriod,
  now = new Date(),
): { start: Date; end: Date } | null {
  switch (period) {
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case '30d':
      return { start: subDays(now, 30), end: now };
    case 'all':
      return null;
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

/** Previous comparable window for sparklines / deltas. */
export function previousPeriodInterval(
  period: DashboardPeriod,
  now = new Date(),
): { start: Date; end: Date } | null {
  switch (period) {
    case 'month': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case '30d':
      return { start: subDays(now, 60), end: subDays(now, 30) };
    case 'all':
      return null;
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export function inInterval(iso: string | null | undefined, interval: { start: Date; end: Date } | null): boolean {
  if (!interval) return true;
  if (!iso) return false;
  try {
    return isWithinInterval(parseISO(iso), interval);
  } catch {
    return false;
  }
}
