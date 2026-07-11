import type { Router } from 'expo-router';

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
