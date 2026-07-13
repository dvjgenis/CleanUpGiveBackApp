/** In-memory onboarding gate for the prototype (no persistence yet). */
let onboardingComplete = false;

export function markOnboardingComplete(): void {
  onboardingComplete = true;
}

export function isOnboardingComplete(): boolean {
  return onboardingComplete;
}
