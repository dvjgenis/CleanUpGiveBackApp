import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const ALERT_SOUND = require('../../assets/sounds/photo-checkpoint-alert.wav');

/** Three short bursts — matches the prior RN `Vibration` pattern. */
const ANDROID_VIBRATE_PATTERN = [0, 300, 150, 300, 150, 300] as const;

const LOAD_TIMEOUT_MS = 4000;
const MIN_ALERT_INTERVAL_MS = 30_000;

let audioModeReady = false;
let alertPlayer: AudioPlayer | null = null;
let preloadPromise: Promise<AudioPlayer> | null = null;
let lastAlertAt = 0;

async function ensureAlertAudioMode() {
  if (audioModeReady) {
    return;
  }

  await setIsAudioActiveAsync(true);
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });
  audioModeReady = true;
}

function waitForPlayerLoaded(player: AudioPlayer, timeoutMs: number): Promise<void> {
  if (player.isLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      subscription.remove();
      resolve();
    }, timeoutMs);

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded) {
        clearTimeout(timeout);
        subscription.remove();
        resolve();
      }
    });
  });
}

async function ensureAlertPlayerLoaded(): Promise<AudioPlayer> {
  if (alertPlayer?.isLoaded) {
    return alertPlayer;
  }

  if (!preloadPromise) {
    preloadPromise = (async () => {
      await ensureAlertAudioMode();
      const player = createAudioPlayer(ALERT_SOUND, { downloadFirst: true });
      await waitForPlayerLoaded(player, LOAD_TIMEOUT_MS);
      alertPlayer = player;
      return player;
    })();
  }

  return preloadPromise;
}

/** Warm the alert clip so the first due ping plays immediately. */
export async function preloadPhotoCheckpointAlert(): Promise<void> {
  try {
    await ensureAlertPlayerLoaded();
  } catch (error) {
    console.warn('[photo-checkpoint] preload failed:', error);
  }
}

async function playAlertHaptics() {
  if (Platform.OS === 'ios') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await new Promise((resolve) => setTimeout(resolve, 280));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 280));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    return;
  }

  Vibration.vibrate([...ANDROID_VIBRATE_PATTERN]);
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

async function playAlertSound() {
  const player = await ensureAlertPlayerLoaded();
  player.volume = 1;
  player.muted = false;

  if (player.currentTime > 0) {
    await player.seekTo(0);
  }

  player.play();
}

/**
 * Sound + haptic feedback when the 30-minute photo checkpoint is due and the
 * in-app photo-required popup is about to appear.
 */
export async function alertPhotoCheckpointDue(): Promise<void> {
  const now = Date.now();
  if (now - lastAlertAt < MIN_ALERT_INTERVAL_MS) {
    return;
  }
  lastAlertAt = now;

  await Promise.all([
    playAlertSound().catch((error) => {
      console.warn('[photo-checkpoint] alert sound failed:', error);
    }),
    playAlertHaptics().catch(() => {
      Vibration.vibrate([...ANDROID_VIBRATE_PATTERN]);
    }),
  ]);
}
