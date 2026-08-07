'use server';

/**
 * Session moderation — ported from `admin/actions/sessions.ts`. web-app has no
 * `/sessions/[id]` detail page, so `adjustHours`/`saveAdminNotes`/letterhead
 * live in `SessionPreviewDrawer.tsx` instead, and bulk-approve lives on the
 * `SessionsPage.tsx` list (checkbox selection) rather than a Review Queue widget.
 *
 * `loadSessionEvidence` hydrates Walking Path + Photos in the same drawer from
 * live `sessions.route` + `checkpoints` (signed via `session-photos` bucket).
 */
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { notifyVolunteerSessionDecision } from '@/lib/notify';
import { computedHours } from '@/lib/mock-data';
import { wouldOvershootCourtOrder } from '@/lib/court-risk';
import { loadVolunteerActivityPattern, type VolunteerActivityPattern } from '@/lib/live-data';
import {
  fetchSessionEvidence,
  type SessionEvidence,
} from '@/lib/session-evidence';

export type { VolunteerActivityPattern } from '@/lib/live-data';

export type { SessionEvidence, SessionPhoto } from '@/lib/session-evidence';

/** Prefix parsed by `SessionPreviewDrawer.tsx` to render the typed-confirmation flow. */
const OVERSHOOT_PREFIX = 'COURT_HOURS_OVERSHOOT';

/**
 * Checks whether setting this session's court-ordered hours to `candidateHours` would
 * push the volunteer's completed court-ordered total past `court_orders.required_hours`.
 * Throws a parseable error (see `OVERSHOOT_PREFIX`) unless the caller passed the typed
 * `confirmOverride: 'OVERRIDE'` — advisory only, never blocks a write outright.
 */
async function assertNoCourtHoursOvershoot(
  supabase: SupabaseClient,
  {
    userId,
    sessionId,
    courtOrdered,
    candidateHours,
    confirmOverride,
  }: {
    userId: string;
    sessionId: string;
    courtOrdered: boolean;
    candidateHours: number;
    confirmOverride?: string;
  },
) {
  if (!courtOrdered || confirmOverride === 'OVERRIDE') return;

  const { data: order } = await supabase
    .from('court_orders')
    .select('required_hours')
    .eq('user_id', userId)
    .single();
  if (!order) return;

  const { data: approvedSessions } = await supabase
    .from('sessions')
    .select('id, duration_seconds, adjusted_hours')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .eq('court_ordered', true)
    .neq('id', sessionId);

  const currentCompletedHours = (approvedSessions ?? []).reduce(
    (sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours),
    0,
  );

  const { overshoots, overBy } = wouldOvershootCourtOrder(order, currentCompletedHours, candidateHours);
  if (overshoots) {
    throw new Error(
      `${OVERSHOOT_PREFIX}:${overBy.toFixed(2)}:${(currentCompletedHours + candidateHours).toFixed(2)}:${order.required_hours}`,
    );
  }
}

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin', user_metadata: { role: 'admin' } };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

function revalidateSessionPaths() {
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/sessions');
}

export async function approveSession(sessionId: string, confirmOverride?: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before, error: fetchError } = await supabase
    .from('sessions')
    .select('status, user_id, activity, duration_seconds, adjusted_hours, court_ordered')
    .eq('id', sessionId)
    .single();

  if (fetchError || !before) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (before.status !== 'under_review') {
    throw new Error(`Cannot approve session: status is "${before.status}", expected "under_review"`);
  }

  await assertNoCourtHoursOvershoot(supabase, {
    userId: before.user_id,
    sessionId,
    courtOrdered: before.court_ordered,
    candidateHours: computedHours(before.duration_seconds, before.adjusted_hours),
    confirmOverride,
  });

  const { error } = await supabase.from('sessions').update({ status: 'approved' }).eq('id', sessionId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'approved session',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { status: 'approved' },
  });

  await notifyVolunteerSessionDecision({
    userId: before.user_id,
    sessionId,
    decision: 'approved',
    activity: before.activity,
  });

  revalidateSessionPaths();
}

export async function declineSession(sessionId: string, reason?: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before, error: fetchError } = await supabase
    .from('sessions')
    .select('status, user_id, activity')
    .eq('id', sessionId)
    .single();

  if (fetchError || !before) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (before.status !== 'under_review') {
    throw new Error(`Cannot decline session: status is "${before.status}", expected "under_review"`);
  }

  const update: Record<string, unknown> = { status: 'not_approved' };
  if (reason) update.decline_reason = reason;

  const { error } = await supabase.from('sessions').update(update).eq('id', sessionId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'declined session',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: update,
  });

  await notifyVolunteerSessionDecision({
    userId: before.user_id,
    sessionId,
    decision: 'declined',
    declineReason: reason,
    activity: before.activity,
  });

  revalidateSessionPaths();
}

export async function adjustHours(sessionId: string, hours: number, confirmOverride?: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('adjusted_hours, duration_seconds, user_id, status, court_ordered')
    .eq('id', sessionId)
    .single();

  // Only an *approved* court-ordered session's hours count toward the requirement —
  // adjusting an under_review session's hours doesn't overshoot until it's approved
  // (approveSession's own check covers that case).
  if (before?.status === 'approved') {
    await assertNoCourtHoursOvershoot(supabase, {
      userId: before.user_id,
      sessionId,
      courtOrdered: before.court_ordered,
      candidateHours: hours,
      confirmOverride,
    });
  }

  const { error } = await supabase.from('sessions').update({ adjusted_hours: hours }).eq('id', sessionId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'adjusted hours',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { adjusted_hours: hours },
  });

  revalidateSessionPaths();
  if (before?.user_id) {
    revalidatePath('/users');
    revalidatePath('/volunteers');
  }
}

export async function saveAdminNotes(sessionId: string, notes: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('admin_notes')
    .eq('id', sessionId)
    .single();

  const { error } = await supabase.from('sessions').update({ admin_notes: notes }).eq('id', sessionId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated admin notes',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { admin_notes: notes },
  });

  revalidatePath('/sessions');
}

export type BulkApproveResult = { sessionId: string; success: boolean; error?: string };

export async function approveSessionsBulk(sessionIds: string[]): Promise<BulkApproveResult[]> {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const results: BulkApproveResult[] = [];

  for (const sessionId of sessionIds) {
    try {
      const { data: before, error: fetchError } = await supabase
        .from('sessions')
        .select('status, user_id, activity, duration_seconds, adjusted_hours, court_ordered')
        .eq('id', sessionId)
        .single();

      if (fetchError || !before) {
        results.push({ sessionId, success: false, error: 'Session not found' });
        continue;
      }

      if (before.status !== 'under_review') {
        results.push({
          sessionId,
          success: false,
          error: `Status is "${before.status}", expected "under_review"`,
        });
        continue;
      }

      // Bulk approve has no per-item typed-confirmation UI — skip and report instead of
      // silently approving past a court order; Donna can confirm the override in the
      // session drawer if it's genuinely intended.
      try {
        await assertNoCourtHoursOvershoot(supabase, {
          userId: before.user_id,
          sessionId,
          courtOrdered: before.court_ordered,
          candidateHours: computedHours(before.duration_seconds, before.adjusted_hours),
        });
      } catch {
        results.push({
          sessionId,
          success: false,
          error: 'Would exceed court-ordered hours — approve individually to confirm override',
        });
        continue;
      }

      const { error } = await supabase.from('sessions').update({ status: 'approved' }).eq('id', sessionId);
      if (error) {
        results.push({ sessionId, success: false, error: error.message });
        continue;
      }

      await writeAuditLog(supabase, {
        adminUserId: user.id,
        action: 'bulk approved session',
        targetTable: 'sessions',
        targetId: sessionId,
        beforeValue: before,
        afterValue: { status: 'approved' },
      });

      await notifyVolunteerSessionDecision({
        userId: before.user_id,
        sessionId,
        decision: 'approved',
        activity: before.activity,
      });

      results.push({ sessionId, success: true });
    } catch (err) {
      results.push({ sessionId, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  revalidateSessionPaths();
  return results;
}

export async function markLetterheadGenerated(sessionId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('letterhead_generated_at')
    .eq('id', sessionId)
    .single();

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('sessions')
    .update({ letterhead_generated_at: now })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'marked letterhead generated',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { letterhead_generated_at: now },
  });

  revalidatePath('/sessions');
}

/** GPS route + signed checkpoint photos for the session preview drawer. */
export async function loadSessionEvidence(sessionId: string): Promise<SessionEvidence | null> {
  return fetchSessionEvidence(sessionId);
}

/** Volunteer activity-pattern rollup for the drawer's red-flag badge (Phase 4/5). */
export async function loadSessionVolunteerPattern(userId: string): Promise<VolunteerActivityPattern> {
  return loadVolunteerActivityPattern(userId);
}
