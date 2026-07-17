import { Platform } from 'react-native';
import { Camera, type CameraDevice } from 'react-native-vision-camera';

export type MultiCamCheckResult =
  | { supported: true; front: CameraDevice; back: CameraDevice }
  | { supported: false; reason: string };

/**
 * Checks whether the device supports mounting front and back cameras simultaneously.
 *
 * iOS:     Requires A12 Bionic or later (iPhone XS / XR+) running iOS 13+.
 *          Vision Camera v4 exposes this via `device.isMultiCam`.
 * Android: Concurrent camera support is device-specific; we verify both
 *          cameras are available and let a runtime failure surface naturally.
 */
export async function checkMultiCamSupport(): Promise<MultiCamCheckResult> {
  const status = await Camera.requestCameraPermission();
  if (status !== 'granted') {
    return { supported: false, reason: 'Camera permission not granted.' };
  }

  const devices = Camera.getAvailableCameraDevices();

  const back = devices.find(
    (d) => d.position === 'back' && d.hardwareLevel !== 'legacy',
  );
  const front = devices.find(
    (d) => d.position === 'front' && d.hardwareLevel !== 'legacy',
  );

  if (!back || !front) {
    return {
      supported: false,
      reason: 'Device does not expose both a front and back camera.',
    };
  }

  if (Platform.OS === 'ios') {
    // isMultiCam signals AVCaptureMultiCamSession support (A12+ chip required)
    if (!back.isMultiCam || !front.isMultiCam) {
      return {
        supported: false,
        reason:
          'Device requires A12 Bionic or later for simultaneous dual-camera capture.',
      };
    }
  }

  return { supported: true, front, back };
}
