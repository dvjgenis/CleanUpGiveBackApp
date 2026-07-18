import type { Router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
} from '@/utils/sessionPermissions';

/** Pop the guide stack so the transition swipes in the reverse direction. */
export function goBackInSessionSetupGuide(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/');
}

/** Step 6 may be reached via Skip (replace), so Previous always targets step 5 with a pop-style replace. */
export function goToSessionSetupStep5(router: Router) {
  router.replace('/session-setup-step5');
}

/** Session setup guide always shows 10 progress pills. */
export const SESSION_SETUP_GUIDE_TOTAL_PILLS = 10;

/**
 * Linear pill indices when location + camera screens are still ahead:
 * 1–5 coachmarks → 6 free-hour → 7 free-kit → 8 location → 9 camera → 10 complete.
 *
 * When a permission screen will auto-skip (already granted), later info screens
 * advance so free-kit sits one step before the finale instead of leaving three
 * empty pills.
 */
export async function getSessionSetupGuidePillProgress(
  screen: 'free-hour' | 'free-kit',
): Promise<{ total: number; active: number }> {
  const [locationGranted, cameraGranted] = await Promise.all([
    isSessionLocationPermissionGranted(),
    isSessionCameraPermissionGranted(),
  ]);

  const permissionScreensRemaining =
    (locationGranted ? 0 : 1) + (cameraGranted ? 0 : 1);

  // Screens still ahead after the current one, including the finale.
  const aheadAfterCurrent =
    screen === 'free-hour'
      ? 1 + permissionScreensRemaining + 1 // kit + perms + complete
      : permissionScreensRemaining + 1; // perms + complete

  const active = SESSION_SETUP_GUIDE_TOTAL_PILLS - aheadAfterCurrent;

  return {
    total: SESSION_SETUP_GUIDE_TOTAL_PILLS,
    active: Math.max(1, Math.min(SESSION_SETUP_GUIDE_TOTAL_PILLS, active)),
  };
}

/** Default pill counts before the async permission check resolves. */
export function getSessionSetupGuidePillProgressDefault(
  screen: 'free-hour' | 'free-kit',
): { total: number; active: number } {
  return {
    total: SESSION_SETUP_GUIDE_TOTAL_PILLS,
    active: screen === 'free-hour' ? 6 : 7,
  };
}

export function useSessionSetupGuidePillProgress(screen: 'free-hour' | 'free-kit') {
  const [progress, setProgress] = useState(() =>
    getSessionSetupGuidePillProgressDefault(screen),
  );

  useEffect(() => {
    let cancelled = false;
    void getSessionSetupGuidePillProgress(screen).then((next) => {
      if (!cancelled) {
        setProgress(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screen]);

  return progress;
}
