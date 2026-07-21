import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session } from '@supabase/supabase-js';

/** Project root only — not `/rest/v1`. See docs/supabase.md */
export function normalizeSupabaseProjectUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
}

const supabaseUrlRaw = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseUrl = normalizeSupabaseProjectUrl(supabaseUrlRaw);
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

let supabaseUrlFormatWarned = false;
if (supabaseUrlRaw && supabaseUrlRaw.trim() !== supabaseUrl && !supabaseUrlFormatWarned) {
  supabaseUrlFormatWarned = true;
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL should be the project root (https://<ref>.supabase.co), not /rest/v1 — see docs/supabase.md',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

let authReadyPromise: Promise<Session | null> | null = null;

/** Ensures an anonymous Supabase session exists (test phase). */
export async function ensureAnonymousAuth(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  if (!authReadyPromise) {
    authReadyPromise = (async () => {
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        return existing.session;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[supabase] anonymous sign-in failed:', error.message);
        return null;
      }

      return data.session;
    })();
  }

  return authReadyPromise;
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const session = (await ensureAnonymousAuth()) ?? (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}

export async function getUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const session = (await ensureAnonymousAuth()) ?? (await supabase.auth.getSession()).data.session;
  return session?.user?.id ?? null;
}
