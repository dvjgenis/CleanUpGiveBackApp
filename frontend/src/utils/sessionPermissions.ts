import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

/** Triggers the OS location permission dialog (when-in-use). */
export async function requestSessionLocationPermission(): Promise<void> {
  await Location.requestForegroundPermissionsAsync();
}

/** Triggers the OS camera permission dialog. */
export async function requestSessionCameraPermission(): Promise<void> {
  await Camera.requestCameraPermissionsAsync();
}
