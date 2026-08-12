import { useEffect } from 'react';

import {
  isCheckpointDueOrGrace,
  subscribeLiveSession,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';

const GRACE_REMINDER_INTERVAL_MS = 45_000;

/** Escalating sound + haptics while a checkpoint is due or in grace. */
export function CheckpointAlertLoop() {
  const { isActive } = useLiveSession();

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    let wasDueOrGrace = false;

    const sync = () => {
      const dueOrGrace = isCheckpointDueOrGrace();

      if (!dueOrGrace) {
        wasDueOrGrace = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }

      if (!wasDueOrGrace) {
        wasDueOrGrace = true;
        void alertPhotoCheckpointDue();
      }

      if (!interval) {
        interval = setInterval(() => {
          if (isCheckpointDueOrGrace()) {
            void alertPhotoCheckpointDue();
          }
        }, GRACE_REMINDER_INTERVAL_MS);
      }
    };

    sync();
    const unsubscribe = subscribeLiveSession(sync);

    return () => {
      unsubscribe();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive]);

  return null;
}
