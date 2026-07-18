import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { staggerDelay } from '@/motion';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as C } from '@/constants/tokens';

export function SessionSetupStep2Screen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <OnboardingProgressPills total={10} active={2} />
        </View>

        <CoachmarkEnter style={s.guideTextContainer}>
          <Text style={s.title}>First up is session setup.</Text>
          <Text style={s.subtitle}>
            Fill out necessary details before you start. Otherwise you cannot start a new session.
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)} style={s.illustrationZone}>
        <Image
          source={require('../../assets/images/screens/session-setup/step2-illustration.png')}
          style={s.illustration}
          resizeMode="contain"
          accessibilityLabel="Session setup form with activity, date, and permission toggles"
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          onContinuePress={() => router.push('/session-setup-step3')}
          onPreviousPress={() => goBackInSessionSetupGuide(router)}
          onSkipPress={() => router.replace('/session-setup-step6')}
          skipAccessibilityLabel="Skip to location permission"
        />
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  // Header — gap 20 between nav and guide text
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 20,
  },

  // Nav row — gap 20 between back arrow and pills
  navContainer: {
    gap: 20,
  },

  // Guide text — gap 10 between title and subtitle
  guideTextContainer: {
    gap: 10,
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 30,
    color: C.textPrimary,
  },

  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textTertiary,
    lineHeight: 22,
  },

  // Illustration
  illustrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  illustration: {
    width: '100%',
    height: '100%',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
  },
});
