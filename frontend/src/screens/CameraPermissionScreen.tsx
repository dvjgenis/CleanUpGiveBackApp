import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CameraPermissionIllustration } from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C, radius } from '@/features/figma-screens/tokens';
import { requestSessionCameraPermission } from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `camera_permission` (725:613) — onboarding step 4 of 5. */
export function CameraPermissionScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  async function handleEnable() {
    await requestSessionCameraPermission();
    router.push('/notification-preference');
  }

  function handleSkip() {
    router.push('/notification-preference');
  }

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.illustration} pointerEvents="none">
        <CameraPermissionIllustration />
      </View>

      <View style={s.safe}>
        <View style={s.header}>
          <OnboardingProgressPills active={4} />
          <View style={s.headingBlock}>
            <Text style={s.title} accessibilityRole="header">
              Allow camera?
            </Text>
            <Text style={s.subtitle}>
              Camera access is required for photo checkpoints during sessions.
            </Text>
          </View>
        </View>

        <View style={s.actions}>
          <AnimatedPressable
            style={s.ghostBtn}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={s.ghostBtnText}>Not now</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={s.primaryBtn}
            onPress={handleEnable}
            accessibilityRole="button"
            accessibilityLabel="Enable camera"
          >
            <Text style={s.primaryBtnText}>Enable camera</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={s.outlineBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Previous"
          >
            <Text style={s.outlineBtnText}>Previous</Text>
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
  illustration: {
    position: 'absolute',
    left: '40.77%',
    top: '9.48%',
    width: 240,
    height: 210,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    gap: 30,
  },
  headingBlock: {
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
  actions: {
    gap: 20,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: C.textPrimary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  outlineBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textPrimary,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  ghostBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
});
