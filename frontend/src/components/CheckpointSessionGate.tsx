import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import {
  ensureLiveSessionTicking,
  evaluateForcedEndTransition,
  isCheckpointDueOrGrace,
  isForcedEndPending,
  subscribeLiveSession,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';

const CHECKPOINT_MODAL_ROUTES = new Set([
  '/photo-checkpoint',
  '/photo-capture',
  '/photo-submitted',
  '/submission-confirmation',
]);

/** Routes checkpoint due/grace/forced-end prompts from any tab while a session is active. */
export function CheckpointSessionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isActive, checkpointWindowStartedAt } = useLiveSession();
  const dueAlertedForWindow = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      dueAlertedForWindow.current = null;
      return;
    }

    ensureLiveSessionTicking();

    const maybePrompt = () => {
      evaluateForcedEndTransition();

      if (isForcedEndPending()) {
        if (
          pathname !== '/live-session' &&
          pathname !== '/photo-capture' &&
          !pathname.startsWith('/submission-confirmation')
        ) {
          router.push('/live-session');
        }
        return;
      }

      if (!isCheckpointDueOrGrace() || checkpointWindowStartedAt == null) {
        return;
      }

      if (CHECKPOINT_MODAL_ROUTES.has(pathname)) {
        return;
      }

      if (dueAlertedForWindow.current === checkpointWindowStartedAt) {
        return;
      }

      dueAlertedForWindow.current = checkpointWindowStartedAt;
      router.push('/photo-checkpoint');
    };

    maybePrompt();
    const unsubscribe = subscribeLiveSession(maybePrompt);
    return () => {
      unsubscribe();
    };
  }, [isActive, pathname, router, checkpointWindowStartedAt]);

  return null;
}
