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
import Svg, { Path } from 'react-native-svg';

const C = {
  bgApp: '#fcf9f8',
  primary: '#009540',
  textPrimary: '#1c1b1b',
  textTertiary: '#3e4a3d',
  textOnPrimary: '#ffffff',
  borderOutline: '#bdcaba',
} as const;

function ProgressPills({ total = 6, active = 4 }: { total?: number; active?: number }) {
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

export function SessionSetupStep4Screen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.navContainer}>
          <AnimatedPressable
            style={s.backBtn}
            onPress={() => goBackInSessionSetupGuide(router)}
          >
            <Svg width={9} height={16} viewBox="0 0 9 16" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.70711 0.292893C9.09763 0.683417 9.09763 1.31658 8.70711 1.70711L2.41421 8L8.70711 14.2929C9.09763 14.6834 9.09763 15.3166 8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071L0.292893 8.70711C-0.0976311 8.31658 -0.0976311 7.68342 0.292893 7.29289L7.29289 0.292893C7.68342 -0.0976311 8.31658 -0.0976311 8.70711 0.292893Z"
                fill={C.textTertiary}
              />
            </Svg>
          </AnimatedPressable>
          <ProgressPills total={6} active={4} />
        </View>

        <CoachmarkEnter style={s.guideTextContainer}>
          <Text style={s.title}>Checkpoint photos for verification.</Text>
          <Text style={s.subtitle}>
            To verify your hours, please take a checkpoint photo every 30 minutes. When it's time, your phone will buzz and a popup will appear. Just snap a quick selfie and keep cleaning!
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)} style={s.illustrationZone}>
        <Image
          source={require('../../assets/images/screens/session-setup-step4-illustration.png')}
          style={s.illustration}
          resizeMode="contain"
          accessibilityLabel="Photo checkpoint popup with 30 minute timer badge and notification bell"
        />
      </CoachmarkEnter>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.buttonContainer}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={() => router.push('/session-setup-step5')}
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

  backBtn: {
    width: 24,
    height: 16,
    justifyContent: 'center',
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
