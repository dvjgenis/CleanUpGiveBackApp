import { Platform } from 'react-native';
import { Camera, type CameraDevice } from 'react-native-vision-camera';

export type MultiCamCheckResult =
  | { supported: true; front: CameraDevice; back: CameraDevice }
  | { supported: false; reason: string };

function preferWideAngle(devices: CameraDevice[], position: 'front' | 'back'): CameraDevice | undefined {
  const matching = devices.filter((d) => d.position === position);
  // Wide-angle physical cameras work most reliably when front+back run together.
  // Avoid gating on `isMultiCam` — that flag means "logical dual/triple lens",
  // not "supports simultaneous front+back capture".
  return (
    matching.find((d) => d.physicalDevices.includes('wide-angle-camera')) ??
    matching.find((d) => d.hardwareLevel !== 'legacy') ??
    matching[0]
  );
}

/**
 * Picks front + back devices for simultaneous dual-camera capture (BeReal-style).
 *
 * iOS XS / XR+ (A12+) can run front+back at once via AVCaptureMultiCamSession;
 * Vision Camera mounts two `<Camera>` views when both devices are available.
 * Runtime failure still falls back to sequential capture in the screen.
 */
export async function checkMultiCamSupport(): Promise<MultiCamCheckResult> {
  const status = await Camera.requestCameraPermission();
  if (status !== 'granted') {
    return { supported: false, reason: 'Camera permission not granted.' };
  }

  const devices = Camera.getAvailableCameraDevices();
  const back = preferWideAngle(devices, 'back');
  const front = preferWideAngle(devices, 'front');

  if (!back || !front) {
    return {
      supported: false,
      reason: 'Device does not expose both a front and back camera.',
    };
  }

  // Web / unsupported platforms never get true dual preview.
  if (Platform.OS === 'web') {
    return { supported: false, reason: 'Dual camera is not available on web.' };
  }

  return { supported: true, front, back };
}
