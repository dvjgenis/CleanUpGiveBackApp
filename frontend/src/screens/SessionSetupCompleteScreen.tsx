import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupCelebration } from '@/components/session-setup/SessionSetupCelebration';
import { staggerDelay } from '@/motion';
import { colors as C } from '@/constants/tokens';

/** Figma `session_setup_guide` finale (251:405) — "That's it! Let's get tracking!" */
export function SessionSetupCompleteScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <CoachmarkEnter style={s.header}>
        <View style={s.navContainer}>
          <OnboardingProgressPills total={10} active={10} />
        </View>

        <Text style={s.headline}>
          <Text style={s.headlineDark}>{"That's it! "}</Text>
          <Text style={s.headlineGreen}>{"Let's get tracking!"}</Text>
        </Text>
      </CoachmarkEnter>

      <View style={s.celebrationZone}>
        <SessionSetupCelebration />
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)} style={s.footer}>
        <AnimatedPressable
          style={s.startBtn}
          onPress={() => router.push('/session-setup')}
          accessibilityRole="button"
          accessibilityLabel="Start tracking"
        >
          <Text style={s.startBtnText}>Start Tracking</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={s.previousBtn}
          onPress={() => goBackInSessionSetupGuide(router)}
          accessibilityRole="button"
          accessibilityLabel="Previous step"
        >
          <Text style={s.previousBtnText}>Previous</Text>
        </AnimatedPressable>
      </CoachmarkEnter>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  navContainer: {
    gap: 20,
  },

  headline: {
    fontSize: 30,
  },
  headlineDark: {
    fontFamily: 'Sanchez_400Regular',
    color: C.textTertiary,
  },
  headlineGreen: {
    fontFamily: 'Sanchez_400Regular',
    color: C.primary,
  },

  celebrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 20,
  },

  startBtn: {
    height: 56,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },

  previousBtn: {
    height: 56,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.primary,
  },
});
