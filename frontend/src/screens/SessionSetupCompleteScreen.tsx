import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { SessionSetupCelebration } from '@/components/session-setup/SessionSetupCelebration';
import { staggerDelay } from '@/motion';
import { colors as C } from '@/constants/tokens';


function ProgressPills({ total = 6, active = 6 }: { total?: number; active?: number }) {
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

/** Figma `session_setup_guide` finale (251:405) — "That's it! Let's get tracking!" */
export function SessionSetupCompleteScreen() {
  const router = useRouter();
  const headerStyle = useFadeUpEnter(0);
  const footerStyle = useFadeUpEnter(staggerDelay(2));

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <Animated.View style={[s.header, headerStyle]}>
        <View style={s.navContainer}>
          <AnimatedPressable
            style={s.backBtn}
            scaleTo={0.98}
            onPress={() => goBackInSessionSetupGuide(router)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
          <ProgressPills total={6} active={6} />
        </View>

        <Text style={s.headline}>
          <Text style={s.headlineDark}>{"That's it! "}</Text>
          <Text style={s.headlineGreen}>{"Let's get tracking!"}</Text>
        </Text>
      </Animated.View>

      <View style={s.celebrationZone}>
        <SessionSetupCelebration />
      </View>

      <Animated.View style={[s.footer, footerStyle]}>
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
      </Animated.View>

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
