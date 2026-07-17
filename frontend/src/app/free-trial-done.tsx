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
 * Preview route for the free-trial paywall (Figma `free_trial_done`, `1141:2178`).
 * Reachable via the dev-only toggle on Home. Continue proceeds to the tracker
 * checkout flow; Pay Later dismisses back to the previous screen.
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
        onContinue={() => router.push('/checkout?mode=tracker' as Href)}
        onPayLater={() => router.back()}
      />
    </SafeAreaProvider>
  );
}
