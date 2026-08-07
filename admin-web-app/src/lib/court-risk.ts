/** Ported from `admin/lib/court-risk.ts` — same court_orders vs. approved-hours math. */
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { computedHours } from '@/lib/mock-data';
import { getVolunteerName, type VolunteerDirectory } from '@/lib/volunteers';

/** Due within this many days (with hours remaining) counts as at-risk, not just overdue. */
const AT_RISK_WINDOW_DAYS = 14;

export type CourtOrderRow = {
  user_id: string;
  required_hours: number;
  due_date: string | null;
};

export type CourtRiskItem = {
  id: string;
  name: string;
  requiredHours: number;
  completedHours: number;
  status: 'in_progress' | 'at_risk' | 'completed';
  dueDate: string;
};

export type OvershootCheck = { overshoots: boolean; overBy: number };

/**
 * Whether approving/adjusting a session to `candidateHours` would push a volunteer's
 * completed court-ordered hours past `order.required_hours`. Advisory only — callers
 * decide what to do with the result (e.g. require a typed confirmation).
 */
export function wouldOvershootCourtOrder(
  order: Pick<CourtOrderRow, 'required_hours'>,
  currentCompletedHours: number,
  candidateHours: number,
): OvershootCheck {
  const projected = currentCompletedHours + candidateHours;
  const overBy = projected - order.required_hours;
  return { overshoots: overBy > 0, overBy: Math.max(0, overBy) };
}

type SessionLike = {
  user_id: string;
  status: string;
  court_ordered: boolean;
  duration_seconds: number | null;
  adjusted_hours: number | null;
};

/**
 * Court-ordered completion per volunteer against `court_orders.required_hours`.
 * Only approved sessions flagged `court_ordered` count toward the requirement —
 * voluntary hours don't reduce a court obligation.
 */
export function buildCourtRisk(
  courtOrders: CourtOrderRow[],
  sessions: SessionLike[],
  directory: VolunteerDirectory,
  now: Date,
): CourtRiskItem[] {
  const completedHoursByUser = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'approved' || !s.court_ordered) continue;
    const hours = computedHours(s.duration_seconds, s.adjusted_hours);
    completedHoursByUser.set(s.user_id, (completedHoursByUser.get(s.user_id) ?? 0) + hours);
  }

  return courtOrders.map((order) => {
    const completedHours = completedHoursByUser.get(order.user_id) ?? 0;
    const remaining = Math.max(0, order.required_hours - completedHours);

    const daysUntilDue = order.due_date ? differenceInCalendarDays(parseISO(order.due_date), now) : null;
    const overdue = daysUntilDue != null && daysUntilDue < 0;
    const dueSoon = daysUntilDue != null && daysUntilDue <= AT_RISK_WINDOW_DAYS;

    let status: CourtRiskItem['status'];
    if (remaining <= 0) {
      status = 'completed';
    } else if (overdue || dueSoon) {
      status = 'at_risk';
    } else {
      status = 'in_progress';
    }

    return {
      id: order.user_id,
      name: getVolunteerName(directory, order.user_id),
      requiredHours: order.required_hours,
      completedHours,
      status,
      dueDate: order.due_date ?? '',
    };
  });
}
