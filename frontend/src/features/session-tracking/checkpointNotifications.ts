import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  CHECKPOINT_MISS_GRACE_MS,
  PHOTO_CHECKPOINT_INTERVAL_SECONDS,
} from './checkpointConstants';

export const CHECKPOINT_NOTIFICATIONS_CHANNEL_ID = 'photo-checkpoints';

const SCHEDULED_ID_PREFIX = 'checkpoint-reminder-';

const GRACE_REMINDER_INTERVAL_SEC = 45;

async function ensureCheckpointChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHECKPOINT_NOTIFICATIONS_CHANNEL_ID, {
    name: 'Photo checkpoints',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    enableVibrate: true,
    sound: 'default',
    bypassDnd: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

function graceMinutesRemaining(graceEndsAtMs: number): number {
  return Math.max(1, Math.ceil((graceEndsAtMs - Date.now()) / 60_000));
}

/** Schedules due + escalating grace reminders for the current checkpoint window. */
export async function scheduleCheckpointNotifications(
  checkpointWindowStartedAt: number,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await ensureCheckpointChannel();
  await cancelCheckpointNotifications();

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted' && permissions.granted !== true) {
    return;
  }

  const dueAtMs =
    checkpointWindowStartedAt + PHOTO_CHECKPOINT_INTERVAL_SECONDS * 1000;
  const graceEndsAtMs = dueAtMs + CHECKPOINT_MISS_GRACE_MS;
  const now = Date.now();

  const contentBase = {
    sound: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    ...(Platform.OS === 'android'
      ? { channelId: CHECKPOINT_NOTIFICATIONS_CHANNEL_ID }
      : {}),
    data: { type: 'photo-checkpoint' },
  };

  if (dueAtMs > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${SCHEDULED_ID_PREFIX}due`,
      content: {
        ...contentBase,
        title: 'Photo checkpoint due',
        body: 'Take your selfie and progress photos now to keep your session valid.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dueAtMs),
      },
    });
  }

  let slot = 0;
  for (
    let fireAt = Math.max(dueAtMs, now + 2000);
    fireAt < graceEndsAtMs;
    fireAt += GRACE_REMINDER_INTERVAL_SEC * 1000
  ) {
    const minutesLeft = graceMinutesRemaining(graceEndsAtMs);
    await Notifications.scheduleNotificationAsync({
      identifier: `${SCHEDULED_ID_PREFIX}grace-${slot}`,
      content: {
        ...contentBase,
        title: 'Photo required',
        body: `Take checkpoint photos now — session ends in about ${minutesLeft} min.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
    slot += 1;
  }
}

export async function cancelCheckpointNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (request.identifier.startsWith(SCHEDULED_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

export function configureCheckpointNotificationPresentation(): void {
  if (Platform.OS === 'web') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
