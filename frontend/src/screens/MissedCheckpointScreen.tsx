import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useAttentionShake, useFadeUpEnter } from '@/components/motion/hooks';
import { PlayOnceLottie } from '@/components/ui/PlayOnceLottie';
import { staggerDelay } from '@/motion';

import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  statusDeclined: tokens.statusDeclinedText,
} as const;

function ExclamationCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={8} stroke={C.statusDeclined} strokeWidth={1.5} />
      <Path
        d="M9 5.25v4.5M9 12.75h.0075"
        stroke={C.statusDeclined}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** PRD §6.13 · Figma `photo_missed` (269:1587). */
export function MissedCheckpointScreen() {
  const router = useRouter();
  const heroShakeStyle = useAttentionShake();
  const heroStyle = useFadeUpEnter(0);
  const infoStyle = useFadeUpEnter(staggerDelay(1));
  const actionsStyle = useFadeUpEnter(staggerDelay(2));

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <ImageBackground
        source={require('../../assets/images/screens/missed-checkpoint/background.png')}
        style={s.background}
        imageStyle={s.backgroundImage}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={s.scrim} />
      </ImageBackground>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <Animated.View style={[s.card, heroStyle]}>
          <View style={s.cardContent}>
            <Animated.View style={[s.heroBlock, heroShakeStyle]}>
              <PlayOnceLottie
                source={require('../../assets/animations/missed-checkpoint.json')}
                accessibilityLabel="Missed checkpoint"
                loop
              />
              <Text style={s.title}>Missed Checkpoint</Text>
            </Animated.View>

            <Animated.View style={[s.infoBox, infoStyle]}>
              <Text style={s.infoPrimary}>
                Photo checkpoint missed. This session can&apos;t be submitted.
              </Text>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <ExclamationCircleIcon />
                <Text style={s.infoSecondary}>
                  To ensure accurate impact tracking, all required visual checkpoints must be
                  completed. Start a new session to record progress.
                </Text>
              </View>
            </Animated.View>

            <Animated.View style={[s.actions, actionsStyle]}>
              <AnimatedPressable
                style={s.restartBtn}
                onPress={() => router.replace('/session-setup')}
                accessibilityRole="button"
                accessibilityLabel="Restart session"
              >
                <Text style={s.restartBtnText}>Restart Session</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={s.homeBtn}
                onPress={() => router.replace('/')}
                accessibilityRole="button"
                accessibilityLabel="Return home"
              >
                <Text style={s.homeBtnText}>Return Home</Text>
              </AnimatedPressable>
            </Animated.View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  background: {
    ...StyleSheet.absoluteFillObject,
  },

  backgroundImage: {
    opacity: 0.4,
  },

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.statusDeclined,
    borderRadius: 16,
    paddingHorizontal: 27,
    paddingVertical: 17,
    alignItems: 'center',
  },

  cardContent: {
    width: '100%',
    maxWidth: 303,
    gap: 20,
    alignItems: 'center',
  },

  heroBlock: {
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
  },

  infoBox: {
    width: '100%',
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 12,
    minHeight: 169,
    paddingHorizontal: 19,
    paddingTop: 15,
    paddingBottom: 16,
    gap: 12,
  },

  infoPrimary: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: C.textPrimary,
  },

  infoDivider: {
    height: 1,
    backgroundColor: C.borderOutline,
    width: '100%',
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  infoSecondary: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
  },

  actions: {
    width: '100%',
    gap: 5,
  },

  restartBtn: {
    width: '100%',
    height: 59,
    backgroundColor: C.statusDeclined,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  restartBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  homeBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  homeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
    textAlign: 'center',
  },
});
