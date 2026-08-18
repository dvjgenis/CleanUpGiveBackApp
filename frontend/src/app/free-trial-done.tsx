import { FreeTrialModal } from '@/features/session-tracking/components/FreeTrialModal';
import {
  finalizeLiveSession,
  getCompletedSessionSnapshot,
} from '@/features/session-tracking/liveSessionStore';
import { BrandLoadingView, waitForBrandLoadingMinimum } from '@/components/ui/BrandLoadingView';
import { colors } from '@/constants/tokens';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Free-trial paywall overlay (Figma `free_trial_done`, `1141:2178`).
 * Presented as a transparentModal over the live tracker. Continue must
 * `replace` (not `push`) so checkout is a normal stack screen — pushing from
 * a modal keeps the modal presentation and wraps checkout like a popup.
 * Pay Later finalizes the session and opens its session-detail screen.
 */
export default function FreeTrialDoneRoute() {
  const router = useRouter();
  const endingRef = useRef(false);
  const [savingSession, setSavingSession] = useState(false);
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  const handlePayLater = async () => {
    if (endingRef.current) {
      return;
    }
    endingRef.current = true;
    setSavingSession(true);
    const startedAt = Date.now();

    try {
      await finalizeLiveSession({ status: 'under_review' });
      await waitForBrandLoadingMinimum(startedAt);
      const snapshot = getCompletedSessionSnapshot();
      const sessionId =
        snapshot?.remoteSessionId ??
        (snapshot ? `session-${snapshot.endedAt}` : null);

      // Clear live-session (+ this modal) off the stack first so Session Detail
      // sits on Home — otherwise Back returns to the dead tracker.
      try {
        router.dismissTo('/');
      } catch {
        router.replace('/');
      }

      if (sessionId) {
        router.push(`/session-detail?id=${encodeURIComponent(sessionId)}` as Href);
      } else {
        router.push('/sessions-list' as Href);
      }
    } catch (error) {
      endingRef.current = false;
      setSavingSession(false);
      console.error('[free-trial-done] Pay Later finalize failed:', error);
    }
  };

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <FreeTrialModal
        onContinue={() =>
          router.replace('/checkout?mode=tracker&returnTo=live-session' as Href)
        }
        onPayLater={() => {
          void handlePayLater();
        }}
      />
      {savingSession ? <BrandLoadingView visible message="Saving session…" /> : null}
    </SafeAreaProvider>
  );
}
