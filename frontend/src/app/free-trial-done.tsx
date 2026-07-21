import { FreeTrialModal } from '@/features/session-tracking/components/FreeTrialModal';
import { colors } from '@/constants/tokens';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Free-trial paywall overlay (Figma `free_trial_done`, `1141:2178`).
 * Presented as a transparentModal over the live tracker. Continue must
 * `replace` (not `push`) so checkout is a normal stack screen — pushing from
 * a modal keeps the modal presentation and wraps checkout like a popup.
 * Pay Later dismisses back to the live session.
 */
export default function FreeTrialDoneRoute() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <FreeTrialModal
        onContinue={() =>
          router.replace('/checkout?mode=tracker&returnTo=live-session' as Href)
        }
        onPayLater={() => router.back()}
      />
    </SafeAreaProvider>
  );
}
