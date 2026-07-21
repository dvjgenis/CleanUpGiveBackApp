import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import {
  consumePendingMissedCheckpointNavigation,
  subscribeLiveSession,
} from '@/features/session-tracking/liveSessionStore';

/** Navigates to missed-checkpoint when finalize ran without LiveSessionScreen mounted. */
export function CheckpointMissNavigationGate() {
  const router = useRouter();

  useEffect(() => {
    const maybeNavigate = () => {
      if (consumePendingMissedCheckpointNavigation()) {
        router.replace('/missed-checkpoint');
      }
    };

    maybeNavigate();
    const unsubscribe = subscribeLiveSession(maybeNavigate);
    return () => {
      unsubscribe();
    };
  }, [router]);

  return null;
}
