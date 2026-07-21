/**
 * Stashes the first dual-checkpoint photos between capture and the session
 * setup form. GPS / timer start only after the form is submitted.
 */

export type PendingSessionStartPhotos = {
  selfieUri: string;
  progressUri: string;
  capturedAt: number;
};

let pendingStartPhotos: PendingSessionStartPhotos | null = null;

export function setPendingSessionStartPhotos(photos: PendingSessionStartPhotos): void {
  pendingStartPhotos = photos;
}

export function getPendingSessionStartPhotos(): PendingSessionStartPhotos | null {
  return pendingStartPhotos;
}

export function consumePendingSessionStartPhotos(): PendingSessionStartPhotos | null {
  const photos = pendingStartPhotos;
  pendingStartPhotos = null;
  return photos;
}

export function clearPendingSessionStartPhotos(): void {
  pendingStartPhotos = null;
}

export function hasPendingSessionStartPhotos(): boolean {
  return pendingStartPhotos != null;
}
