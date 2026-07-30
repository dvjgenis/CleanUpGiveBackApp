/**
 * Lightweight period selection helpers — ported from `admin/lib/dashboard-period.ts`
 * (parse + labels only; no date-fns interval math since web-app mock pages don't
 * re-query by range yet).
 */

export type DashboardPeriod = "day" | "month" | "30d" | "year" | "all" | "custom";

export type PeriodSelection = {
  period: DashboardPeriod;
  /** Inclusive start, yyyy-MM-dd — set when period is custom. */
  from: string | null;
  /** Inclusive end, yyyy-MM-dd. */
  to: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateParam(raw: string | null | undefined): raw is string {
  if (!raw || !DATE_RE.test(raw)) return false;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isFinite(d.getTime());
}

export function parsePeriod(raw: string | string[] | undefined | null): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  switch (value) {
    case "day":
    case "month":
    case "30d":
    case "year":
    case "all":
    case "custom":
      return value;
    default:
      return "day";
  }
}

export function parsePeriodSelection(params: {
  period?: string | string[] | null;
  from?: string | string[] | null;
  to?: string | string[] | null;
}): PeriodSelection {
  const fromRaw = Array.isArray(params.from) ? params.from[0] : params.from;
  const toRaw = Array.isArray(params.to) ? params.to[0] : params.to;
  const from = isValidDateParam(fromRaw) ? fromRaw : null;
  const to = isValidDateParam(toRaw) ? toRaw : null;

  if (from || to) {
    const start = from ?? to!;
    const end = to ?? from!;
    const [a, b] = start <= end ? [start, end] : [end, start];
    return { period: "custom", from: a, to: b };
  }

  return { period: parsePeriod(params.period), from: null, to: null };
}

function fmtLong(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function periodLabel(selection: PeriodSelection, now = new Date()): string {
  switch (selection.period) {
    case "day":
      return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    case "month":
      return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "30d":
      return "Last 30 days";
    case "year":
      return String(now.getFullYear());
    case "all":
      return "All time";
    case "custom": {
      if (!selection.from || !selection.to) return "Custom range";
      if (selection.from === selection.to) return fmtLong(selection.from);
      return `${fmtLong(selection.from)} – ${fmtLong(selection.to)}`;
    }
    default: {
      const _exhaustive: never = selection.period;
      return _exhaustive;
    }
  }
}

export type DateFilterable = {
  started_at?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

/** Filter records by period selection based on date fields */
export function filterByPeriod<T extends DateFilterable>(
  records: T[],
  selection: PeriodSelection,
  now = new Date()
): T[] {
  if (selection.period === "all") return records;

  const { start, end } = getPeriodRange(selection, now);
  
  return records.filter((record) => {
    const recordDate = getRecordDate(record);
    return recordDate && recordDate >= start && recordDate <= end;
  });
}

function getRecordDate(record: DateFilterable): Date | null {
  const dateStr = record.started_at || record.created_at || record.createdAt;
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function getPeriodRange(selection: PeriodSelection, now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999); // End of day
  
  switch (selection.period) {
    case "day": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0); // Start of day
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
    case "custom": {
      if (!selection.from || !selection.to) {
        // Fallback to today if custom range is incomplete
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
      const start = new Date(`${selection.from}T00:00:00`);
      const customEnd = new Date(`${selection.to}T23:59:59`);
      return { start, end: customEnd };
    }
    case "all":
    default: {
      const start = new Date(0); // Beginning of time
      return { start, end };
    }
  }
}
