import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const ALERT_SOUND = require('../../assets/sounds/photo-checkpoint-alert.wav');

/** Three short bursts — matches the prior RN `Vibration` pattern. */
const ANDROID_VIBRATE_PATTERN = [0, 300, 150, 300, 150, 300] as const;

let audioModeReady = false;

async function ensureAlertAudioMode() {
  if (audioModeReady) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
  audioModeReady = true;
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
  await ensureAlertAudioMode();
  const player = createAudioPlayer(ALERT_SOUND);
  player.play();

  // Release after the ~0.45s clip finishes (plus a small buffer).
  setTimeout(() => {
    try {
      player.release();
    } catch {
      // Player may already be released if the JS runtime tore down.
    }
  }, 1200);
}

/**
 * Sound + haptic feedback when the 30-minute photo checkpoint is due and the
 * in-app photo-required popup is about to appear.
 */
export async function alertPhotoCheckpointDue(): Promise<void> {
  try {
    await playAlertHaptics();
  } catch {
    Vibration.vibrate([...ANDROID_VIBRATE_PATTERN]);
  }

  try {
    await playAlertSound();
  } catch (error) {
    console.warn('[photo-checkpoint] alert sound failed:', error);
  }
}
