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
 * Screens that share permission-aware pill progress.
 *
 * Linear indices when location + camera are still ahead:
 * 1–5 coachmarks → 6 free-hour → 7 free-kit → 8 location → 9 camera → 10 complete.
 *
 * When a permission screen will auto-skip (already granted), earlier screens
 * advance so the bar stays contiguous instead of jumping (e.g. step 5 at 5
 * filled → free-hour at 8 filled when both perms are already granted).
 */
export type SessionSetupGuidePillScreen =
  | 'guide'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'free-hour'
  | 'free-kit';

/** 1-based coachmark index for linear defaults (guide = step 1). */
const COACHMARK_LINEAR_ACTIVE: Record<
  Exclude<SessionSetupGuidePillScreen, 'free-hour' | 'free-kit'>,
  number
> = {
  guide: 1,
  step2: 2,
  step3: 3,
  step4: 4,
  step5: 5,
};

/** Coachmarks still remaining after the current coachmark (before free-hour). */
const COACHMARKS_AHEAD: Record<
  Exclude<SessionSetupGuidePillScreen, 'free-hour' | 'free-kit'>,
  number
> = {
  guide: 4,
  step2: 3,
  step3: 2,
  step4: 1,
  step5: 0,
};

export async function getSessionSetupGuidePillProgress(
  screen: SessionSetupGuidePillScreen,
): Promise<{ total: number; active: number }> {
  const [locationGranted, cameraGranted] = await Promise.all([
    isSessionLocationPermissionGranted(),
    isSessionCameraPermissionGranted(),
  ]);

  const permissionScreensRemaining =
    (locationGranted ? 0 : 1) + (cameraGranted ? 0 : 1);

  // Screens still ahead after the current one, including the finale.
  let aheadAfterCurrent: number;
  switch (screen) {
    case 'guide':
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
      // remaining coachmarks + free-hour + free-kit + perms + complete
      aheadAfterCurrent =
        COACHMARKS_AHEAD[screen] + 2 + permissionScreensRemaining + 1;
      break;
    case 'free-hour':
      aheadAfterCurrent = 1 + permissionScreensRemaining + 1; // kit + perms + complete
      break;
    case 'free-kit':
      aheadAfterCurrent = permissionScreensRemaining + 1; // perms + complete
      break;
    default: {
      const _exhaustive: never = screen;
      throw new Error(`Unknown session setup pill screen: ${_exhaustive}`);
    }
  }

  const active = SESSION_SETUP_GUIDE_TOTAL_PILLS - aheadAfterCurrent;

  return {
    total: SESSION_SETUP_GUIDE_TOTAL_PILLS,
    active: Math.max(1, Math.min(SESSION_SETUP_GUIDE_TOTAL_PILLS, active)),
  };
}

/** Default pill counts before the async permission check resolves (assumes both perms still ahead). */
export function getSessionSetupGuidePillProgressDefault(
  screen: SessionSetupGuidePillScreen,
): { total: number; active: number } {
  let active: number;
  switch (screen) {
    case 'guide':
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
      active = COACHMARK_LINEAR_ACTIVE[screen];
      break;
    case 'free-hour':
      active = 6;
      break;
    case 'free-kit':
      active = 7;
      break;
    default: {
      const _exhaustive: never = screen;
      throw new Error(`Unknown session setup pill screen: ${_exhaustive}`);
    }
  }

  return {
    total: SESSION_SETUP_GUIDE_TOTAL_PILLS,
    active,
  };
}

export function useSessionSetupGuidePillProgress(screen: SessionSetupGuidePillScreen) {
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
