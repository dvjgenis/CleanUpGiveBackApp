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
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { AppSplashScreen } from '@/components/AppSplashScreen';
import { consumeHomeFadeIn } from '@/features/onboarding/homeEnterTransition';
import { isOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { HomeScreen } from '@/features/figma-screens/screens/HomeScreen';
import { colors } from '@/features/figma-screens/tokens';
import { easing, durations } from '@/motion';

// Module-level flag: persists across router.replace('/') navigations within the
// same JS bundle session, so the splash only plays on cold start.
let hasBooted = false;

function enterParamIsFade(enter: string | string[] | undefined): boolean {
  if (enter === 'fade') return true;
  return Array.isArray(enter) && enter[0] === 'fade';
}

function runHomeFadeIn(homeOpacity: SharedValue<number>, reducedMotion: boolean | null) {
  if (reducedMotion) {
    homeOpacity.value = 1;
    return;
  }
  cancelAnimation(homeOpacity);
  homeOpacity.value = 0;
  // Commit opacity 0 on the UI thread before timing up — assigning 0 then
  // withTiming(1) in the same tick can no-op when the view was already at 1.
  requestAnimationFrame(() => {
    homeOpacity.value = withTiming(1, {
      duration: durations.modalEnter,
      easing: easing.easeOut,
    });
  });
}

export default function App() {
  const router = useRouter();
  const { enter } = useLocalSearchParams<{ enter?: string | string[] }>();
  const [splashDone, setSplashDone] = useState(hasBooted);
  const reducedMotion = useReducedMotion();
  // Consume once on mount so remounts after Go Home always fade in.
  const [mountFade] = useState(() => consumeHomeFadeIn() || enterParamIsFade(enter));

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

  // Cold start: visible (splash handles entrance). Return visits / Go Home: start hidden.
  const homeOpacity = useSharedValue(hasBooted || mountFade ? 0 : 1);

  const handleSplashReady = useCallback(() => {
    hasBooted = true;
    setSplashDone(true);
  }, []);

  useEffect(() => {
    if (!splashDone) {
      return;
    }
    if (mountFade) {
      runHomeFadeIn(homeOpacity, reducedMotion);
      return;
    }
    homeOpacity.value = withTiming(1, {
      duration: durations.screenEnter,
      easing: easing.easeOut,
    });
  }, [splashDone, mountFade, reducedMotion, homeOpacity]);

  // Refocus without remount (index left under the stack): run another fade.
  useFocusEffect(
    useCallback(() => {
      if (!consumeHomeFadeIn()) {
        return;
      }
      runHomeFadeIn(homeOpacity, reducedMotion);
    }, [homeOpacity, reducedMotion]),
  );

  // Drop the one-shot fade param after the transition so BottomNav stays instant.
  useEffect(() => {
    if (!enterParamIsFade(enter)) {
      return;
    }
    const t = setTimeout(() => {
      router.setParams({ enter: undefined });
    }, durations.modalEnter + 50);
    return () => clearTimeout(t);
  }, [enter, router]);

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
