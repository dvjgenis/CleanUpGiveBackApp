import { Platform } from 'react-native';
import { VisionCamera, type CameraDevice } from 'react-native-vision-camera';

export type MultiCamCheckResult =
  | { supported: true }
  | { supported: false; reason: string };

/**
 * Checks permission and whether AVCaptureMultiCamSession (front+back simultaneously)
 * is available on this device. Uses the VisionCamera v5 session API.
 *
 * Runtime failure inside DualCapture still falls back to SequentialCapture.
 */
export async function checkMultiCamSupport(): Promise<MultiCamCheckResult> {
  const granted = await VisionCamera.requestCameraPermission();
  if (!granted) {
    return { supported: false, reason: 'Camera permission not granted.' };
  }

  if (Platform.OS === 'web') {
    return { supported: false, reason: 'Dual camera is not available on web.' };
  }

  if (!VisionCamera.supportsMultiCamSessions) {
    return { supported: false, reason: 'Device does not support multi-cam sessions.' };
  }

  try {
    const deviceFactory = await VisionCamera.createDeviceFactory();
    const hasCombination = (deviceFactory.supportedMultiCamDeviceCombinations as CameraDevice[][]).some(
      (devices) =>
        devices.some((d) => d.position === 'front') &&
        devices.some((d) => d.position === 'back')
    );
    if (!hasCombination) {
      return { supported: false, reason: 'No compatible front+back camera combination.' };
    }
    return { supported: true };
  } catch (e) {
    return { supported: false, reason: String(e) };
  }
}
