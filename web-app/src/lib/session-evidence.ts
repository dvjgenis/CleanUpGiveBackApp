/**
 * Load GPS route + signed checkpoint photos for a session preview.
 * Used by `loadSessionEvidence` (server action) so the client drawer can
 * hydrate Walking Path / Photos when live Supabase data exists.
 */
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { parseSessionRoute, type RouteCoordinate } from '@/lib/session-route';

export type SessionPhoto = {
  url: string;
  label: 'Selfie' | 'Progress';
  capturedAt: string | null;
};

export type SessionEvidence = {
  route: RouteCoordinate[];
  photos: SessionPhoto[];
  checkpointCount: number;
  /** True when checkpoints have storage paths but signing produced no URLs. */
  photoSignFailed: boolean;
};

type CheckpointRow = {
  id: string;
  selfie_path: string | null;
  progress_path: string | null;
  captured_at: string | null;
};

export async function fetchSessionEvidence(sessionId: string): Promise<SessionEvidence | null> {
  // Mock fixture ids are short (`m1`, …) — skip the round-trip.
  if (!sessionId || sessionId.length < 20) {
    return null;
  }

  const supabase = await createDataClient();
  const [{ data: session, error: sessionError }, { data: checkpoints, error: cpError }] =
    await Promise.all([
      supabase.from('sessions').select('id, route').eq('id', sessionId).maybeSingle(),
      supabase
        .from('checkpoints')
        .select('id, selfie_path, progress_path, captured_at')
        .eq('session_id', sessionId)
        .order('captured_at', { ascending: true }),
    ]);

  if (sessionError || !session) {
    return null;
  }
  if (cpError) {
    console.warn(`[session-evidence] checkpoints query failed for ${sessionId}:`, cpError.message);
  }

  const route = parseSessionRoute(session.route);
  const rows = (checkpoints ?? []) as CheckpointRow[];
  const checkpointCount = rows.length;

  const serviceClient = await tryCreateServiceClient();
  const photos: SessionPhoto[] = [];
  let hadPaths = false;

  if (serviceClient) {
    for (const cp of rows) {
      if (cp.selfie_path) {
        hadPaths = true;
        const { data, error } = await serviceClient.storage
          .from('session-photos')
          .createSignedUrl(cp.selfie_path, 3600);
        if (error) {
          console.warn(`[session-evidence] selfie sign failed:`, error.message);
        } else if (data?.signedUrl) {
          photos.push({ url: data.signedUrl, label: 'Selfie', capturedAt: cp.captured_at });
        }
      }
      if (cp.progress_path) {
        hadPaths = true;
        const { data, error } = await serviceClient.storage
          .from('session-photos')
          .createSignedUrl(cp.progress_path, 3600);
        if (error) {
          console.warn(`[session-evidence] progress sign failed:`, error.message);
        } else if (data?.signedUrl) {
          photos.push({ url: data.signedUrl, label: 'Progress', capturedAt: cp.captured_at });
        }
      }
    }
  } else if (rows.some((cp) => cp.selfie_path || cp.progress_path)) {
    hadPaths = true;
  }

  return {
    route,
    photos,
    checkpointCount,
    photoSignFailed: hadPaths && photos.length === 0,
  };
}
