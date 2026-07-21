import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import {
  configureCheckpointNotificationPresentation,
} from '@/features/session-tracking/checkpointNotifications';
import {
  getLiveSessionState,
  isCheckpointMissed,
} from '@/features/session-tracking/liveSessionStore';

/** Wires local notification presentation and tap-through routing for checkpoints. */
export function CheckpointNotificationBootstrap() {
  const router = useRouter();

  useEffect(() => {
    configureCheckpointNotificationPresentation();

    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      const { isActive } = getLiveSessionState();
      if (!isActive || isCheckpointMissed()) {
        router.push('/missed-checkpoint');
        return;
      }
      router.push('/photo-checkpoint');
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}
