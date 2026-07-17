/**
 * Requests a fade-in the next time Home (`/`) gains focus.
 * Used by tour finale and submission-confirmation "Go Home".
 * Pair with fading the source screen out before `router.replace`, then
 * `?enter=fade` + this flag so home opacity-fades in (tab switches stay
 * `animation: 'none'`).
 */
let pendingHomeFadeIn = false;

export function requestHomeFadeIn() {
  pendingHomeFadeIn = true;
}

export function consumeHomeFadeIn(): boolean {
  if (!pendingHomeFadeIn) {
    return false;
  }
  pendingHomeFadeIn = false;
  return true;
}
