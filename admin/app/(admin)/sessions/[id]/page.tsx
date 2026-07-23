import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { SessionActions } from './SessionActions';
import { PhotoGrid } from './PhotoGrid';

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !session) notFound();

  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('*')
    .eq('session_id', id)
    .order('captured_at', { ascending: true });

  // Get volunteer info from auth.users via service role
  const { data: userResponse } = await serviceClient.auth.admin.getUserById(session.user_id);
  const volunteer = userResponse?.user;
  const volunteerName = volunteer?.user_metadata?.full_name ?? 'Unknown volunteer';

  // Sign photo URLs (1-hour expiry)
  const signedCheckpoints = await Promise.all(
    (checkpoints ?? []).map(async (cp) => {
      const [selfieUrl, progressUrl] = await Promise.all([
        cp.selfie_path
          ? serviceClient.storage.from('checkpoints').createSignedUrl(cp.selfie_path, 3600)
          : null,
        cp.progress_path
          ? serviceClient.storage.from('checkpoints').createSignedUrl(cp.progress_path, 3600)
          : null,
      ]);
      return {
        ...cp,
        selfieSignedUrl: selfieUrl?.data?.signedUrl ?? null,
        progressSignedUrl: progressUrl?.data?.signedUrl ?? null,
      };
    })
  );

  const isAdjusted = session.adjusted_hours != null;
  const durationLabel = formatDuration(session.duration_seconds, session.adjusted_hours);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
        <div>
          <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
            Session {shortId(session.id)}
          </p>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
            {session.activity ?? 'Cleanup Session'}
          </h1>
          <p className="font-body text-base text-text-tertiary mt-xs">{volunteerName}</p>
        </div>
        <StatusChip status={session.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        {/* Left column — Info + Photos */}
        <div className="lg:col-span-3 flex flex-col gap-lg">
          {/* Session Info */}
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Session Info</h2>
            <dl className="grid grid-cols-2 gap-x-lg gap-y-md">
              <InfoRow label="Volunteer" value={volunteerName} />
              <InfoRow label="User ID" value={shortId(session.user_id)} />
              <InfoRow label="Activity" value={session.activity ?? '—'} />
              <InfoRow label="Court Ordered" value={session.court_ordered ? 'Yes' : 'No'} />
              <InfoRow label="Started" value={formatDate(session.started_at, 'MMM dd, yyyy HH:mm')} />
              <InfoRow label="Ended" value={formatDate(session.ended_at, 'MMM dd, yyyy HH:mm')} />
              <InfoRow
                label="Duration"
                value={durationLabel}
                note={isAdjusted ? 'Adjusted by admin' : undefined}
              />
              <InfoRow label="Distance" value={formatMiles(session.distance_miles)} />
              <InfoRow label="Checkpoints" value={String(checkpoints?.length ?? 0)} />
              {session.letterhead_generated_at && (
                <InfoRow
                  label="Letterhead"
                  value={`Last generated: ${formatDate(session.letterhead_generated_at)}`}
                />
              )}
              {session.description && (
                <div className="col-span-2">
                  <InfoRow label="Description" value={session.description} />
                </div>
              )}
            </dl>
          </section>

          {/* Photos */}
          {signedCheckpoints.length > 0 && (
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">
                Photos ({signedCheckpoints.length} checkpoint{signedCheckpoints.length !== 1 ? 's' : ''})
              </h2>
              <PhotoGrid checkpoints={signedCheckpoints} />
            </section>
          )}
        </div>

        {/* Right column — Admin Actions */}
        <div className="lg:col-span-2">
          <SessionActions
            session={session}
            volunteerId={session.user_id}
            volunteerName={volunteerName}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase mb-xs">{label}</dt>
      <dd className="font-body text-base text-text-primary">
        {value}
        {note && <span className="ml-sm font-data text-[11px] text-primary">({note})</span>}
      </dd>
    </div>
  );
}
