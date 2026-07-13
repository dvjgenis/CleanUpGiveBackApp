import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSplashScreen } from '@/components/AppSplashScreen';
import { isOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { HomeScreen } from '@/features/figma-screens/screens/HomeScreen';
import { colors } from '@/features/figma-screens/tokens';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const handleSplashReady = useCallback(() => setSplashDone(true), []);

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
          <AppSplashScreen fontsLoaded={fontsLoaded ?? false} onReady={handleSplashReady} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Cold start / Expo Go: always enter onboarding until Log In or setup-complete.
  if (!isOnboardingComplete()) {
    return <Redirect href="/welcome" />;
  }

  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}
