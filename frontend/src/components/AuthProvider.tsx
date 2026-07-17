import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { hydrateMapThemeSettings } from '@/features/session-tracking/mapThemeStore';
import { hydrateRecentSessionsFromApi } from '@/features/session-tracking/recentSessionsStore';
import { ensureAnonymousAuth, isSupabaseConfigured } from '@/lib/supabase';

type AuthContextValue = {
  ready: boolean;
  configured: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  ready: true,
  configured: false,
});

export function useAuthReady() {
  return use(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    void hydrateMapThemeSettings();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }

    let cancelled = false;

    ensureAnonymousAuth()
      .then(() => hydrateRecentSessionsFromApi())
      .catch((error) => {
        console.warn('[auth] bootstrap failed:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <AuthContext value={{ ready, configured: isSupabaseConfigured }}>
      {children}
    </AuthContext>
  );
}
