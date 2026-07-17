import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { staggerDelay } from '@/motion';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as C } from '@/constants/tokens';


function ProgressPills({ total = 7, active = 2 }: { total?: number; active?: number }) {
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

export function SessionSetupStep2Screen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <ProgressPills total={6} active={2} />
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

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.buttonContainer}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={() => router.push('/session-setup-step3')}
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

  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  pill: {
    flex: 1,
    height: 4,
    borderRadius: 9999,
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

  // Footer — top border, gap 30 between button container and skip
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 30,
    alignItems: 'center',
  },

  // Button container — gap 20 between Continue and Previous
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
