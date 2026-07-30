'use server';

/**
 * Session moderation — ported from `admin/actions/sessions.ts`. web-app has no
 * `/sessions/[id]` detail page, so `adjustHours`/`saveAdminNotes`/letterhead
 * live in `SessionPreviewDrawer.tsx` instead, and bulk-approve lives on the
 * `SessionsPage.tsx` list (checkbox selection) rather than a Review Queue widget.
 */
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { notifyVolunteerSessionDecision } from '@/lib/notify';

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

export async function approveSession(sessionId: string) {
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
    throw new Error(`Cannot approve session: status is "${before.status}", expected "under_review"`);
  }

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

export async function adjustHours(sessionId: string, hours: number) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('adjusted_hours, duration_seconds, user_id')
    .eq('id', sessionId)
    .single();

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
        .select('status, user_id, activity')
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
