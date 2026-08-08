'use server';

/**
 * Event server actions — ported from `admin/actions/events.ts`. Writes straight
 * to the shared `public.events` table and `event-photos` storage bucket, so a
 * published/edited/deleted event here shows up immediately in the mobile
 * app's Upcoming Events feed. `notifyAtRiskVolunteers` reuses the same
 * `resend.ts`/`audit.ts`/`volunteers.ts` ports as `@/actions/sessions`.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { logEmailSend } from '@/lib/email-log';
import { getTemplate } from '@/lib/email-templates';
import { renderTemplate } from '@/lib/email-template-render';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { getVolunteerDirectory } from '@/lib/volunteers';
import { fromDatetimeLocalValue, formatEventWhen, type EventRow } from '@/lib/events';
import { geocodeAddress } from '@/lib/geocode';

const EVENT_PHOTOS_BUCKET = 'event-photos';
const MAX_EVENT_PHOTOS = 8;

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

function revalidateEventPaths(eventId?: string) {
  revalidatePath('/events');
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/edit`);
  }
}

async function uploadEventPhoto(supabase: SupabaseClient, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(EVENT_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from(EVENT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function collectPhotoFiles(formData: FormData): File[] {
  return formData
    .getAll('photo_files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function resolveEventImageUrls(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<{ image_url: string | null; image_urls: string[] }> {
  const existing = formData
    .getAll('existing_image_urls')
    .map((v) => String(v).trim())
    .filter(Boolean);

  const room = Math.max(0, MAX_EVENT_PHOTOS - existing.length);
  const uploaded = await Promise.all(
    collectPhotoFiles(formData)
      .slice(0, room)
      .map((file) => uploadEventPhoto(supabase, file)),
  );

  const seen = new Set<string>();
  const imageUrls: string[] = [];
  for (const url of [...existing, ...uploaded]) {
    if (seen.has(url)) continue;
    seen.add(url);
    imageUrls.push(url);
    if (imageUrls.length >= MAX_EVENT_PHOTOS) break;
  }

  return { image_urls: imageUrls, image_url: imageUrls[0] ?? null };
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

async function eventFieldsFromForm(supabase: SupabaseClient, formData: FormData) {
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

  const { image_url: imageUrl, image_urls: imageUrls } = await resolveEventImageUrls(supabase, formData);

  const address = String(formData.get('address') ?? '').trim() || null;
  let lat = parseOptionalNumber(formData.get('lat'));
  let lng = parseOptionalNumber(formData.get('lng'));

  // Any venue: if the form has an address but no verified/selected pin,
  // Census (then Google if keyed) geocodes so EventLocationMap works.
  if (address && (lat == null || lng == null)) {
    const geo = await geocodeAddress(address);
    if ('latitude' in geo) {
      lat = geo.latitude;
      lng = geo.longitude;
    }
  }

  return {
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim() || null,
    address,
    lat,
    lng,
    starts_at: startsAt,
    ends_at: endsAt,
    what_to_bring: String(formData.get('what_to_bring') ?? '').trim() || null,
    organizer: String(formData.get('organizer') ?? '').trim() || null,
    image_url: imageUrl,
    image_urls: imageUrls,
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
    const fields = await eventFieldsFromForm(supabase, formData);

    const { data, error } = await supabase.from('events').insert(fields as never).select('id').single();

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
    const fields = await eventFieldsFromForm(supabase, formData);

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

  const { data: before } = await supabase.from('events').select('is_published').eq('id', eventId).single();

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

export type NotifyAtRiskResult = {
  sent: number;
  failed: number;
  skippedNoEmail: number;
};

function eventMapsUrl(event: EventRow): string | null {
  if (event.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
  }
  if (event.lat != null && event.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;
  }
  return null;
}

/**
 * Emails the picked court-ordered/at-risk volunteers about an event via
 * Resend, soft-failing (counting every recipient as failed, not throwing)
 * when `RESEND_API_KEY` is unset, same as `backend/sessions/src/routes/emails.ts`.
 */
export async function notifyAtRiskVolunteers(
  eventId: string,
  recipientUserIds: string[],
): Promise<NotifyAtRiskResult> {
  const user = await getAdminUser();
  const supabase = await createServiceClient();

  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (eventError || !eventRow) throw new Error('Event not found');
  const event = eventRow as EventRow;

  const directory = await getVolunteerDirectory();
  const resend = getResendClient();
  const when = formatEventWhen(event.starts_at, event.ends_at);
  const template = await getTemplate('at_risk_nudge');

  let sent = 0;
  let failed = 0;
  let skippedNoEmail = 0;

  for (const userId of recipientUserIds) {
    const entry = directory.get(userId);
    if (!entry?.email) {
      skippedNoEmail += 1;
      continue;
    }
    if (!resend) {
      failed += 1;
      continue;
    }

    const templateVars = {
      volunteer_name: entry.name,
      event_title: event.title,
      event_when: when,
      event_address: event.address?.trim() || event.location?.trim() || null,
      event_maps_url: eventMapsUrl(event),
    };
    const subject = renderTemplate(template.subject, templateVars);
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: entry.email,
      subject,
      html: renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true }),
    });

    await logEmailSend(supabase, {
      userId,
      templateType: 'at_risk_nudge',
      toEmail: entry.email,
      subject,
      status: error ? 'failed' : 'sent',
      resendMessageId: data?.id ?? null,
      adminUserId: user.id,
    });

    if (error) failed += 1;
    else {
      sent += 1;
      await supabase.from('event_volunteer_notices').upsert(
        {
          event_id: eventId,
          user_id: userId,
          notified_at: new Date().toISOString(),
        } as never,
        { onConflict: 'event_id,user_id' },
      );
    }
  }

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'notified at-risk volunteers',
    targetTable: 'events',
    targetId: eventId,
    afterValue: { recipientCount: recipientUserIds.length, sent, failed, skippedNoEmail },
  });

  return { sent, failed, skippedNoEmail };
}
