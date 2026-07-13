import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { staggerDelay } from '@/motion';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors as C } from '@/constants/tokens';


function ProgressPills({ total = 6, active = 1 }: { total?: number; active?: number }) {
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

export function SessionSetupGuideScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* Header — gap 30 between top section and headline, gap 20 within top section */}
      <View style={s.header}>
        <View style={s.topSection}>
          <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
            <Svg width={9} height={16} viewBox="0 0 9 16" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.70711 0.292893C9.09763 0.683417 9.09763 1.31658 8.70711 1.70711L2.41421 8L8.70711 14.2929C9.09763 14.6834 9.09763 15.3166 8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071L0.292893 8.70711C-0.0976311 8.31658 -0.0976311 7.68342 0.292893 7.29289L7.29289 0.292893C7.68342 -0.0976311 8.31658 -0.0976311 8.70711 0.292893Z"
                fill={C.textTertiary}
              />
            </Svg>
          </AnimatedPressable>
          <ProgressPills total={6} active={1} />
        </View>

        <CoachmarkEnter>
          <Text style={s.headline}>
            <Text style={s.headlineDark}>{'How does this work? '}</Text>
            <Text style={s.headlineGreen}>{"Let's walk through it."}</Text>
          </Text>
        </CoachmarkEnter>
      </View>

      <CoachmarkEnter delayMs={staggerDelay(1)} style={s.illustrationZone}>
        <Image
          source={require('../../assets/images/screens/session-setup/guide-illustration.png')}
          style={s.illustration}
          resizeMode="contain"
        />
      </CoachmarkEnter>

      <View style={s.footer}>
        <SessionSetupGuideFooterActions
          onContinuePress={() => router.push('/session-setup-step2')}
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

  // Header container — left/right pad 16, gap 30 between top section and headline
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 30,
  },

  // Top section (back arrow + pills) — gap 20
  topSection: {
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
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
  },
});
