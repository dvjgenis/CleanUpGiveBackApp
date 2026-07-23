'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      id: 'bypass-admin',
      user_metadata: { role: 'admin' },
    };
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

function revalidateSessionPaths(sessionId: string) {
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/sessions/${sessionId}`);
}

export async function approveSession(sessionId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'approved' })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'approved session',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { status: 'approved' },
  });

  revalidateSessionPaths(sessionId);
}

export async function declineSession(sessionId: string, reason?: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('status, admin_notes')
    .eq('id', sessionId)
    .single();

  const update: Record<string, unknown> = { status: 'not_approved' };
  if (reason) update.admin_notes = reason;

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

  revalidateSessionPaths(sessionId);
}

export async function markInvalid(sessionId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'invalid' })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'marked session invalid',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { status: 'invalid' },
  });

  revalidateSessionPaths(sessionId);
}

export async function adjustHours(sessionId: string, hours: number) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('adjusted_hours, duration_seconds')
    .eq('id', sessionId)
    .single();

  const { error } = await supabase
    .from('sessions')
    .update({ adjusted_hours: hours })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'adjusted hours',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { adjusted_hours: hours },
  });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/');
}

export async function saveAdminNotes(sessionId: string, notes: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('sessions')
    .select('admin_notes')
    .eq('id', sessionId)
    .single();

  const { error } = await supabase
    .from('sessions')
    .update({ admin_notes: notes })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated admin notes',
    targetTable: 'sessions',
    targetId: sessionId,
    beforeValue: before,
    afterValue: { admin_notes: notes },
  });

  revalidatePath(`/sessions/${sessionId}`);
}
