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
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { AppSplashScreen } from '@/components/AppSplashScreen';
import { isOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { HomeScreen } from '@/features/figma-screens/screens/HomeScreen';
import { colors } from '@/features/figma-screens/tokens';
import { easing, durations } from '@/motion';

// Module-level flag: persists across router.replace('/') navigations within the
// same JS bundle session, so the splash only plays on cold start.
let hasBooted = false;

export default function App() {
  const [splashDone, setSplashDone] = useState(hasBooted);

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

  // When navigating back (hasBooted=true), start invisible and fade in.
  // On cold start (hasBooted=false), start visible — the splash already handles the entrance.
  const homeOpacity = useSharedValue(hasBooted ? 0 : 1);

  const handleSplashReady = useCallback(() => {
    hasBooted = true;
    setSplashDone(true);
  }, []);

  useEffect(() => {
    if (splashDone) {
      homeOpacity.value = withTiming(1, {
        duration: durations.screenEnter,
        easing: easing.easeOut,
      });
    }
  }, [splashDone, homeOpacity]);

  const homeStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: homeOpacity.value,
  }));

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
          <AppSplashScreen fontsLoaded={fontsLoaded ?? false} onReady={handleSplashReady} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isOnboardingComplete()) {
    return <Redirect href="/welcome" />;
  }

  return (
    <SafeAreaProvider>
      <Animated.View style={homeStyle}>
        <HomeScreen />
      </Animated.View>
    </SafeAreaProvider>
  );
}
