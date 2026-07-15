import { apiFetch, isApiConfigured } from './api';

export type ApiSessionStatus =
  | 'active'
  | 'under_review'
  | 'approved'
  | 'not_approved'
  | 'invalid';

export type ApiSession = {
  id: string;
  userId: string;
  activity: string | null;
  courtOrdered: boolean;
  description: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  distanceMiles: number | null;
  route: number[][] | null;
  status: ApiSessionStatus;
  createdAt: string;
};

export type CreateSessionInput = {
  activity: string;
  courtOrdered: boolean;
  description: string;
  date: string;
};

export async function createSession(input: CreateSessionInput): Promise<{
  id: string;
  status: ApiSessionStatus;
  startedAt: string;
} | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addCheckpoint(
  sessionId: string,
  input: {
    selfiePath: string;
    progressPath: string;
    capturedAt: string;
    submittedEarly: boolean;
  },
): Promise<{ id: string } | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}/checkpoints`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function finalizeSession(
  sessionId: string,
  input: {
    endedAt: string;
    durationSeconds: number;
    distanceMiles: number;
    route: number[][];
    status?: ApiSessionStatus;
  },
): Promise<{ id: string; status: ApiSessionStatus } | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}/finalize`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function listSessions(): Promise<ApiSession[]> {
  if (!isApiConfigured) {
    return [];
  }

  const data = await apiFetch<{ sessions: ApiSession[] }>('/sessions');
  return data.sessions;
}

export async function getSession(sessionId: string): Promise<{
  session: ApiSession;
  checkpoints: Array<{
    id: string;
    selfiePath: string | null;
    progressPath: string | null;
    capturedAt: string | null;
    submittedEarly: boolean;
  }>;
} | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch(`/sessions/${sessionId}`);
}
