import type { Href, Router } from 'expo-router';
import type { NavigationState, PartialState } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
} from '@/utils/sessionPermissions';

type StackRoute = {
  name: string;
  params?: Record<string, unknown>;
};

/** Screen the user was on before opening the Track tab / session-setup guide. */
let sessionSetupGuideReturnHref: Href | null = null;

export function resetSessionSetupGuideReturnHref() {
  sessionSetupGuideReturnHref = null;
}

export function setSessionSetupGuideReturnHref(href: Href) {
  sessionSetupGuideReturnHref = href;
}

export function getSessionSetupGuideReturnHref(): Href | null {
  return sessionSetupGuideReturnHref;
}

export function hrefFromStackRoute(route: StackRoute): Href {
  if (route.name === 'index') {
    return '/';
  }

  const pathname = route.name.startsWith('/') ? route.name : `/${route.name}`;
  const params = route.params;
  if (!params) {
    return pathname as Href;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || key === 'entry') {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return (query ? `${pathname}?${query}` : pathname) as Href;
}

export function captureSessionSetupGuideReturnHref(
  state: NavigationState | PartialState<NavigationState>,
) {
  const routes = state.routes;
  const index = state.index ?? Math.max(routes.length - 1, 0);

  if (index <= 0) {
    setSessionSetupGuideReturnHref('/');
    return;
  }

  const previousRoute = routes[index - 1];
  if (!previousRoute) {
    setSessionSetupGuideReturnHref('/');
    return;
  }

  setSessionSetupGuideReturnHref(hrefFromStackRoute(previousRoute as StackRoute));
}

/** Leave the guide from free-hour / free-kit back to the pre-Track tab screen. */
export function exitSessionSetupGuideToTrackEntry(router: Router) {
  const returnHref = getSessionSetupGuideReturnHref();
  if (returnHref) {
    router.dismissTo(returnHref);
    return;
  }

  goBackInSessionSetupGuide(router);
}

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

/**
 * Step 7 may be reached via auto-skip (`router.replace`) from step 6 when
 * location was already granted, so Previous always targets step 6 with a
 * pop-style replace instead of relying on back-stack history.
 */
export function goToSessionSetupStep6(router: Router) {
  router.replace('/session-setup-step6');
}

/**
 * The guide finale may be reached via a chain of auto-skip replaces (step 6 →
 * step 7 → complete, when location/camera were already granted), which can
 * collapse or bypass the back-stack entries for those steps. Previous always
 * targets step 7 explicitly with a pop-style replace, rather than
 * `goBackInSessionSetupGuide`'s `canGoBack()` check — which can incorrectly
 * fall through to the home screen after that replace chain.
 */
export function goToSessionSetupStep7(router: Router) {
  router.replace('/session-setup-step7');
}

/**
 * Previous from the guide finale — never `router.back()` (stack may only be
 * home → complete after auto-skip replaces). Walks backward through the
 * linear guide, skipping permission screens that were auto-skipped forward.
 */
export async function goToPreviousFromSessionSetupComplete(router: Router) {
  const [locationGranted, cameraGranted] = await Promise.all([
    isSessionLocationPermissionGranted(),
    isSessionCameraPermissionGranted(),
  ]);

  if (!cameraGranted) {
    router.replace('/session-setup-step7');
    return;
  }

  if (!locationGranted) {
    router.replace('/session-setup-step6');
    return;
  }

  router.replace('/session-free-kit');
}

/**
 * Minimum guide steps: 5 coachmarks + free-hour + free-kit + complete.
 * Up to two optional permission screens are added when not yet granted.
 */
export const SESSION_SETUP_GUIDE_BASE_PILLS = 8;

/** Max pills when both location and camera permission screens are still ahead. */
export const SESSION_SETUP_GUIDE_TOTAL_PILLS =
  SESSION_SETUP_GUIDE_BASE_PILLS + 2;

/**
 * Screens that share permission-aware pill progress.
 *
 * Linear indices: 1–5 coachmarks → 6 free-hour → 7 free-kit → 8 location
 * (when shown) → 9 camera (when shown) → finale.
 *
 * When a permission screen will auto-skip (already granted), `total` shrinks
 * so coachmarks always start at pill 1 and later steps still advance by one.
 */
export type SessionSetupGuidePillScreen =
  | 'guide'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'free-hour'
  | 'free-kit'
  | 'location'
  | 'camera'
  | 'complete';

/** 1-based coachmark index (guide = step 1). */
const COACHMARK_LINEAR_ACTIVE: Record<
  'guide' | 'step2' | 'step3' | 'step4' | 'step5',
  number
> = {
  guide: 1,
  step2: 2,
  step3: 3,
  step4: 4,
  step5: 5,
};

export function getSessionSetupGuideTotalPills(
  permissionScreensRemaining: number,
): number {
  return SESSION_SETUP_GUIDE_BASE_PILLS + permissionScreensRemaining;
}

async function getSessionSetupPermissionScreensRemaining(): Promise<number> {
  const [locationGranted, cameraGranted] = await Promise.all([
    isSessionLocationPermissionGranted(),
    isSessionCameraPermissionGranted(),
  ]);

  return (locationGranted ? 0 : 1) + (cameraGranted ? 0 : 1);
}

function getActivePillForScreen(
  screen: SessionSetupGuidePillScreen,
  total: number,
): number {
  switch (screen) {
    case 'guide':
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
      return COACHMARK_LINEAR_ACTIVE[screen];
    case 'free-hour':
      return 6;
    case 'free-kit':
      return 7;
    case 'location':
      return 8;
    case 'camera':
      return total - 1;
    case 'complete':
      return total;
    default: {
      const _exhaustive: never = screen;
      throw new Error(`Unknown session setup pill screen: ${_exhaustive}`);
    }
  }
}

export async function getSessionSetupGuidePillProgress(
  screen: SessionSetupGuidePillScreen,
): Promise<{ total: number; active: number }> {
  const permissionScreensRemaining =
    await getSessionSetupPermissionScreensRemaining();
  const total = getSessionSetupGuideTotalPills(permissionScreensRemaining);
  const active = getActivePillForScreen(screen, total);

  return {
    total,
    active: Math.max(1, Math.min(total, active)),
  };
}

/** Default pill counts before the async permission check resolves (assumes both perms still ahead). */
export function getSessionSetupGuidePillProgressDefault(
  screen: SessionSetupGuidePillScreen,
): { total: number; active: number } {
  const total = SESSION_SETUP_GUIDE_TOTAL_PILLS;

  return {
    total,
    active: getActivePillForScreen(screen, total),
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
