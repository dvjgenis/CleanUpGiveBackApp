import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { staggerDelay } from '@/motion';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as C } from '@/constants/tokens';


function ProgressPills({ total = 7, active = 5 }: { total?: number; active?: number }) {
  return (
    <View style={s.pillsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[s.pill, { backgroundColor: i < active ? C.primary : C.borderOutline }]}
        />
      ))}
    </View>
  );
}

export function SessionSetupStep5Screen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <ProgressPills total={6} active={5} />
        </View>

        <CoachmarkEnter style={s.guideTextContainer}>
          <Text style={s.title}>Now that the session is over, sit back and relax!</Text>
          <Text style={s.subtitle}>
            Once a session is completed, a summary of the session is visible.{' '}
            <Text style={s.subtitleEmphasis}>Sessions are not automatically approved.</Text>
            {' '}They are sent to Clean Up Give Back to be manually verified. You will be notified of your session status in app and through email confirmation.
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)} style={s.illustrationZone}>
        <Image
          source={require('../../assets/images/screens/session-setup/step5-illustration.png')}
          style={s.illustration}
          resizeMode="contain"
          accessibilityLabel="Completed session summary with under review status, duration, date, and time"
        />
      </CoachmarkEnter>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.buttonContainer}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={() => router.push('/session-setup-step6')}
          >
            <Text style={s.continueBtnText}>Continue</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.previousBtn}
            onPress={() => goBackInSessionSetupGuide(router)}
          >
            <Text style={s.previousBtnText}>Previous</Text>
          </AnimatedPressable>
        </View>
        <AnimatedPressable
          onPress={() => router.replace('/session-setup-step6')}
          accessibilityRole="button"
          accessibilityLabel="Skip to location permission"
        >
          <Text style={s.skipText}>Skip</Text>
        </AnimatedPressable>
      </View>

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

  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  pill: {
    flex: 1,
    height: 4,
    borderRadius: 9999,
  },

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

  subtitleEmphasis: {
    fontFamily: 'NotoSans_700Bold',
    color: C.statusPendingText,
    textDecorationLine: 'underline',
  },

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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 30,
    alignItems: 'center',
  },

  buttonContainer: {
    alignSelf: 'stretch',
    gap: 20,
  },

  continueBtn: {
    height: 56,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
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
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },

  skipText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },
});
