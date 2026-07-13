import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { LocationPermissionIllustration } from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import { requestSessionLocationPermission } from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `location_permission` (725:553) — onboarding step 3 of 5. */
export function LocationPermissionScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  async function handleContinue() {
    await requestSessionLocationPermission();
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
          <OnboardingProgressPills active={3} />
          <View style={s.titleSection}>
            <Text style={s.title} accessibilityRole="header">
              Allow location?
            </Text>
            <Text style={s.subtitle}>
              Location is used only during active cleanup sessions to verify your route.
            </Text>
          </View>
        </View>

        <View style={s.footer}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Enable location"
          >
            <Text style={s.continueBtnText}>Enable location</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.previousBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Previous"
          >
            <Text style={s.previousBtnText}>Previous</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.notNowBtn}
            onPress={handleNotNow}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={s.notNowText}>Not now</Text>
          </AnimatedPressable>
        </View>
      </View>
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
    justifyContent: 'space-between',
  },
  illustration: {
    position: 'absolute',
    left: '52.05%',
    top: '9.07%',
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
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 20,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  continueBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.textPrimary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previousBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textPrimary,
  },
  notNowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  notNowText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
});
