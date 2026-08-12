import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import {
  configureCheckpointNotificationPresentation,
} from '@/features/session-tracking/checkpointNotifications';
import { getLiveSessionState } from '@/features/session-tracking/liveSessionStore';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';

function isPhotoCheckpointNotification(
  notification: Notifications.Notification,
): boolean {
  return notification.request.content.data?.type === 'photo-checkpoint';
}

/** Wires local notification presentation and tap-through routing for checkpoints. */
export function CheckpointNotificationBootstrap() {
  const router = useRouter();

  useEffect(() => {
    configureCheckpointNotificationPresentation();

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (!isPhotoCheckpointNotification(notification)) {
          return;
        }

        const { isActive } = getLiveSessionState();
        if (!isActive) {
          return;
        }

        // Foreground OS banners often skip sound; play the in-app alert clip.
        void alertPhotoCheckpointDue();
      },
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        const { isActive } = getLiveSessionState();
        if (!isActive) {
          return;
        }

        // Tapping a system notification means the app wasn't in the foreground
        // on the tracker — stack it underneath the modal so "Back to tracker"
        // lands there instead of wherever the app happened to resume.
        router.push('/live-session');
        router.push('/photo-checkpoint');
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  return null;
}
