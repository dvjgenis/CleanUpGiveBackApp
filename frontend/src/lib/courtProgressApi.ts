import { apiFetch, isApiConfigured } from './api';

export type CourtProgressStatus = 'completed' | 'at_risk' | 'in_progress' | null;

export type CourtProgressResponse = {
  hasCourtOrder: boolean;
  requiredHours: number | null;
  completedHours: number;
  remainingHours: number;
  dueDate: string | null;
  caseReference: string | null;
  status: CourtProgressStatus;
};

/** Backend/sessions' `GET /me/court-progress` — mirrors admin's court-risk math
 * server-side so the mobile client never reads `court_orders` directly (RLS on that
 * table stays admin-only). Returns null when the API isn't configured or the request
 * fails; callers should treat null the same as "no court order" rather than erroring. */
export async function fetchCourtProgress(): Promise<CourtProgressResponse | null> {
  if (!isApiConfigured) {
    return null;
  }
  try {
    return await apiFetch<CourtProgressResponse>('/me/court-progress');
  } catch (err) {
    console.warn('[courtProgressApi] fetchCourtProgress failed:', err);
    return null;
  }
}
