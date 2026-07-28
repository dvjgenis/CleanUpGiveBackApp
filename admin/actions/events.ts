'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { fromDatetimeLocalValue } from '@/lib/events';

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

function revalidateEventPaths(eventId?: string) {
  revalidatePath('/events');
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/edit`);
  }
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function eventFieldsFromForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) {
    throw new Error('Title is required');
  }

  const startsAtRaw = String(formData.get('starts_at') ?? '').trim();
  const startsAt = fromDatetimeLocalValue(startsAtRaw);
  if (!startsAt) {
    throw new Error('Start date and time are required');
  }

  const endsAtRaw = String(formData.get('ends_at') ?? '').trim();
  const endsAt = endsAtRaw ? fromDatetimeLocalValue(endsAtRaw) : null;

  return {
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    lat: parseOptionalNumber(formData.get('lat')),
    lng: parseOptionalNumber(formData.get('lng')),
    starts_at: startsAt,
    ends_at: endsAt,
    what_to_bring: String(formData.get('what_to_bring') ?? '').trim() || null,
    organizer: String(formData.get('organizer') ?? '').trim() || null,
    image_url: String(formData.get('image_url') ?? '').trim() || null,
    is_published: formData.get('is_published') === 'on' || formData.get('is_published') === 'true',
    updated_at: new Date().toISOString(),
  };
}

export type EventActionState = {
  error?: string;
};

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const user = await getAdminUser();
    const supabase = await createServiceClient();
    const fields = eventFieldsFromForm(formData);

    const { data, error } = await supabase
      .from('events')
      .insert(fields as never)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!data?.id) return { error: 'Failed to create event' };

    await writeAuditLog(supabase, {
      adminUserId: user.id,
      action: 'created event',
      targetTable: 'events',
      targetId: data.id,
      afterValue: fields,
    });

    revalidateEventPaths(data.id);
    redirect(`/events/${data.id}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    return { error: err instanceof Error ? err.message : 'Failed to create event' };
  }
}

export async function updateEvent(
  eventId: string,
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const user = await getAdminUser();
    const supabase = await createServiceClient();
    const fields = eventFieldsFromForm(formData);

    const { data: before } = await supabase.from('events').select('*').eq('id', eventId).single();

    const { error } = await supabase.from('events').update(fields as never).eq('id', eventId);
    if (error) return { error: error.message };

    await writeAuditLog(supabase, {
      adminUserId: user.id,
      action: 'updated event',
      targetTable: 'events',
      targetId: eventId,
      beforeValue: before,
      afterValue: fields,
    });

    revalidateEventPaths(eventId);
    redirect(`/events/${eventId}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    return { error: err instanceof Error ? err.message : 'Failed to update event' };
  }
}

export async function setEventPublished(eventId: string, isPublished: boolean) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from('events')
    .select('is_published')
    .eq('id', eventId)
    .single();

  const { error } = await supabase
    .from('events')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() } as never)
    .eq('id', eventId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: isPublished ? 'published event' : 'unpublished event',
    targetTable: 'events',
    targetId: eventId,
    beforeValue: before,
    afterValue: { is_published: isPublished },
  });

  revalidateEventPaths(eventId);
}

export async function deleteEvent(eventId: string) {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: before } = await supabase.from('events').select('*').eq('id', eventId).single();

  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'deleted event',
    targetTable: 'events',
    targetId: eventId,
    beforeValue: before,
  });

  revalidateEventPaths(eventId);
  redirect('/events');
}
