import '@/global.css';

import { Stack } from 'expo-router';

import { AuthProvider } from '@/components/AuthProvider';

import '@/features/session-tracking/backgroundLocationTask';

const guideBackwardScreenOptions = {
  animationTypeForReplace: 'pop' as const,
};

/**
 * `session-setup-complete` uses the same default slide as the other guide
 * screens. Step7 can land here via `router.replace` (camera already granted)
 * as well as via a normal push from free-hour/free-kit — so keep replace
 * forward (`push`) instead of the shared guide `pop`, which would reverse
 * the slide on a screen that is progressing the user forward.
 */
const sessionSetupCompleteScreenOptions = {
  animationTypeForReplace: 'push' as const,
};

/** Tab roots: no animation when switching via BottomNavBar. */
const tabRootScreenOptions = {
  animation: 'none' as const,
};

/**
 * Home stays instant for BottomNav (`replace('/')` with no params).
 * Tour finale and submission-confirmation Go Home pass `enter=fade`
 * for a cross-fade into home.
 */
const homeScreenOptions = ({ route }: { route: { params?: { enter?: string } } }) => ({
  animation: route.params?.enter === 'fade' ? ('fade' as const) : ('none' as const),
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={homeScreenOptions} />
      <Stack.Screen name="session-setup-guide" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup" />
      <Stack.Screen name="session-setup-step2" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step3" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step4" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step5" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step6" />
      <Stack.Screen name="session-setup-step7" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-free-hour" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-free-kit" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-complete" options={sessionSetupCompleteScreenOptions} />
      <Stack.Screen name="live-session" options={{ animation: 'slide_from_bottom', animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="session-feedback" />
      <Stack.Screen name="give-feedback" />
      <Stack.Screen name="feedback-thank-you" />
      <Stack.Screen name="photo-checkpoint" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="photo-capture" />
      <Stack.Screen name="photo-submitted" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="submission-confirmation" />
      <Stack.Screen name="missed-checkpoint" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="shop" options={tabRootScreenOptions} />
      <Stack.Screen name="donate" />
      <Stack.Screen name="product-detail" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="purchase-confirmation" />
      <Stack.Screen name="sessions-list" options={tabRootScreenOptions} />
      <Stack.Screen name="session-detail" />
      <Stack.Screen name="account" options={tabRootScreenOptions} />
      <Stack.Screen name="map-theme" />
      <Stack.Screen name="delete-account-confirm" />
      <Stack.Screen name="account-privacy" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="privacy-what-we-collect" />
      <Stack.Screen name="privacy-how-we-use-it" />
      <Stack.Screen name="privacy-who-we-share-it-with" />
      <Stack.Screen name="privacy-how-we-protect-it" />
      <Stack.Screen name="request-data" />
      <Stack.Screen name="request-data-sent" />
      <Stack.Screen name="order-history" />
      <Stack.Screen name="donation-history" />
      <Stack.Screen name="approval-history" />
      <Stack.Screen name="export-service-record" />
      <Stack.Screen name="export-record-success" />
      <Stack.Screen name="event-detail" />
      <Stack.Screen name="under-age" />
      <Stack.Screen name="under-age-learn-why" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="creating-account" />
      <Stack.Screen name="account-phone" />
      <Stack.Screen name="account-details" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="camera-permission" />
      <Stack.Screen name="free-hour" />
      <Stack.Screen name="free-kit" />
      <Stack.Screen name="notification-preference" />
      <Stack.Screen name="setup-complete" />
      <Stack.Screen name="home-tour" />
      <Stack.Screen name="shop-tour" />
      <Stack.Screen name="track-tour" />
      <Stack.Screen name="session-tour" />
      <Stack.Screen name="set-tour" />
      <Stack.Screen name="prototype/[screen]" />
      <Stack.Screen name="free-trial-done" options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }} />
    </Stack>
    </AuthProvider>
  );
}
