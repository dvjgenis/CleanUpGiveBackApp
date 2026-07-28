import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDataClient } from '@/lib/supabase/server';
import { InfoRow } from '@/components/ui/InfoRow';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { formatEventWhen } from '@/lib/events';
import { EventDetailActions } from './EventDetailActions';
import type { Event } from '@/types/database';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createDataClient();

  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  if (!data) notFound();

  const event = data as Event;
  const when = formatEventWhen(event.starts_at, event.ends_at);
  const isPast = new Date(event.starts_at).getTime() < Date.now();

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/events"
        className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Events
      </Link>

      <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
        <div className="min-w-0">
          <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
            {isPast ? 'Past event' : 'Upcoming event'}
          </p>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">{event.title}</h1>
          <p className="font-body text-base text-text-tertiary mt-xs">{when}</p>
        </div>
        <span
          className={`shrink-0 font-data text-[11px] font-semibold rounded-xs px-sm py-xs border ${
            event.is_published
              ? 'text-primary bg-[#f7fff1] border-primary/30'
              : 'text-[#835400] bg-[#ffddb5] border-[#fcab29]/50'
          }`}
        >
          {event.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        <div className="lg:col-span-3 flex flex-col gap-lg">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Details</h2>
            <dl>
              <InfoRow label="When" value={when} />
              <InfoRow label="Location" value={event.location?.trim() || '—'} />
              <InfoRow label="Address" value={event.address?.trim() || '—'} />
              <InfoRow label="Organizer" value={event.organizer?.trim() || '—'} />
              <InfoRow
                label="Coordinates"
                value={
                  event.lat != null && event.lng != null
                    ? `${event.lat}, ${event.lng}`
                    : '—'
                }
              />
            </dl>
          </section>

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Description</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.description?.trim() || 'No description yet.'}
            </p>
          </section>

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">What to bring</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.what_to_bring?.trim() || '—'}
            </p>
          </section>

          {event.image_url ? (
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Hero image</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt=""
                className="w-full max-h-72 object-cover rounded-sm border border-border-outline"
              />
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg sticky top-6">
            <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Actions</h2>
            <EventDetailActions eventId={event.id} isPublished={event.is_published} />
            <p className="font-body text-[12px] text-text-tertiary mt-md">
              {event.is_published
                ? 'This event is visible in the mobile app Upcoming Events feed.'
                : 'Publish this event to show it in the mobile app.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
