import { Stack } from 'expo-router';

import { AuthProvider } from '@/components/AuthProvider';

const guideBackwardScreenOptions = {
  animationTypeForReplace: 'pop' as const,
};

/** Tab roots: no animation when switching via BottomNavBar. */
const tabRootScreenOptions = {
  animation: 'none' as const,
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={tabRootScreenOptions} />
      <Stack.Screen name="session-setup-guide" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup" />
      <Stack.Screen name="session-setup-step2" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step3" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step4" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step5" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step6" />
      <Stack.Screen name="session-setup-step7" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-complete" options={guideBackwardScreenOptions} />
      <Stack.Screen name="live-session" options={{ animation: 'none' }} />
      <Stack.Screen name="photo-checkpoint" />
      <Stack.Screen name="photo-capture" />
      <Stack.Screen name="photo-submitted" />
      <Stack.Screen name="submission-confirmation" />
      <Stack.Screen name="missed-checkpoint" />
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
      <Stack.Screen name="notification-preference" />
      <Stack.Screen name="setup-complete" />
      <Stack.Screen name="home-tour" />
      <Stack.Screen name="shop-tour" />
      <Stack.Screen name="track-tour" />
      <Stack.Screen name="session-tour" />
      <Stack.Screen name="set-tour" />
      <Stack.Screen name="prototype/[screen]" />
    </Stack>
    </AuthProvider>
  );
}
