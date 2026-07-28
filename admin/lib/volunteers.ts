import type { SupabaseClient, User } from '@supabase/supabase-js';

export type VolunteerDirectoryEntry = {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
};

export type VolunteerDirectory = Map<string, VolunteerDirectoryEntry>;

const LIST_USERS_PAGE_SIZE = 1000;

/** Fallback chain: onboarding-synced display name → email local-part → short id. */
export function resolveVolunteerName(user: Pick<User, 'id' | 'email' | 'user_metadata'>): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

  if (user.email) {
    const local = user.email.split('@')[0];
    if (local) return local;
  }

  return `Volunteer ${user.id.slice(0, 8).toUpperCase()}`;
}

/**
 * Loads every Supabase Auth user once per request into an id-keyed map.
 * Requires the service-role client (`createServiceClient`) — Admin API only.
 */
export async function getVolunteerDirectory(serviceClient: SupabaseClient): Promise<VolunteerDirectory> {
  const directory: VolunteerDirectory = new Map();
  let page = 1;

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PAGE_SIZE,
    });
    if (error || !data) break;

    for (const user of data.users) {
      directory.set(user.id, {
        id: user.id,
        name: resolveVolunteerName(user),
        email: user.email ?? null,
        createdAt: user.created_at,
      });
    }

    if (data.users.length < LIST_USERS_PAGE_SIZE) break;
    page += 1;
  }

  return directory;
}

export function getVolunteerName(directory: VolunteerDirectory, userId: string): string {
  return directory.get(userId)?.name ?? `Volunteer ${userId.slice(0, 8).toUpperCase()}`;
}
