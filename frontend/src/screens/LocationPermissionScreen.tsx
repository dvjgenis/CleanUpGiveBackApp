import { LocationPermissionIllustration } from '@/components/onboarding/OnboardingIcons';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import { requestSessionLocationPermission } from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `location_permission` (725:553) — onboarding step 3 of 5. */
export function LocationPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  async function handleContinue() {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestSessionLocationPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Location access is off',
          'Enable Location for Expo Go in Settings to continue using location features.',
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.push('/camera-permission') },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    } finally {
      setIsRequesting(false);
    }
    router.push('/camera-permission');
  }

  function handleNotNow() {
    router.push('/camera-permission');
  }

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.illustration} pointerEvents="none">
        <LocationPermissionIllustration />
      </View>

      <View style={s.flex}>
        <View style={s.main}>
          <OnboardingProgressPills active={3} total={7} />
          <View style={s.titleSection}>
            <Text style={s.title} accessibilityRole="header">
              Allow location?
            </Text>
            <Text style={s.subtitle}>
              Location is used only during active cleanup sessions to verify your route.
            </Text>
          </View>
        </View>
      </View>

      <OnboardingInfoFooterActions
        onContinue={handleContinue}
        onPrevious={() => router.back()}
        onSkip={handleNotNow}
        continueLabel={isRequesting ? 'Requesting…' : 'Enable location'}
        skipLabel="Not now"
        disabled={isRequesting}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  illustration: {
    position: 'absolute',
    left: '52.05%',
    top: '15.6%',
    width: 240,
    height: 290,
  },
  main: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 30,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 24,
  },
});
