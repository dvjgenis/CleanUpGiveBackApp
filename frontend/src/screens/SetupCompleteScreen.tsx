import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  AccountCreatedCheck,
  SuccessBlobBottomRight,
  SuccessBlobTopLeft,
} from '@/components/onboarding/OnboardingIcons';
import { prefetchTourGraphics } from '@/components/onboarding/tourAssets';
import { markOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { colors as C, radius } from '@/features/figma-screens/tokens';
import { durations, easing, enterFrom } from '@/motion';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';

/** Subtle opposite-corner drift for the lime success blobs (px). */
const BLOB_DRIFT = 28;

/** Figma `create_account_success` (133:93) — setup-complete after onboarding. */
export function SetupCompleteScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const copyOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const copyTranslateY = useSharedValue(reducedMotion ? 0 : enterFrom.translateY);
  const ctaOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const ctaTranslateY = useSharedValue(reducedMotion ? 0 : enterFrom.translateY);

  // Top-left blob drifts toward bottom-right; bottom-right toward top-left.
  const blobTLX = useSharedValue(0);
  const blobTLY = useSharedValue(0);
  const blobBRX = useSharedValue(0);
  const blobBRY = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    void prefetchTourGraphics(['shopShowcase', 'trackMap', 'homeStats']);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const enterTiming = { duration: durations.screenEnter, easing: easing.easeOut };
    const blobTiming = { duration: durations.modalEnter, easing: easing.easeOut };

    copyOpacity.value = withTiming(1, enterTiming);
    copyTranslateY.value = withTiming(0, enterTiming);
    ctaOpacity.value = withTiming(1, enterTiming);
    ctaTranslateY.value = withTiming(0, enterTiming);

    blobTLX.value = withTiming(BLOB_DRIFT, blobTiming);
    blobTLY.value = withTiming(BLOB_DRIFT, blobTiming);
    blobBRX.value = withTiming(-BLOB_DRIFT, blobTiming);
    blobBRY.value = withTiming(-BLOB_DRIFT, blobTiming);
  }, [
    blobBRX,
    blobBRY,
    blobTLX,
    blobTLY,
    copyOpacity,
    copyTranslateY,
    ctaOpacity,
    ctaTranslateY,
    reducedMotion,
  ]);

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const blobTLStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: blobTLX.value }, { translateY: blobTLY.value }],
  }));

  const blobBRStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: blobBRX.value }, { translateY: blobBRY.value }],
  }));

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <Animated.View style={[s.blobTL, blobTLStyle]} pointerEvents="none">
        <SuccessBlobTopLeft size={280} />
      </Animated.View>
      <Animated.View style={[s.blobBR, blobBRStyle]} pointerEvents="none">
        <SuccessBlobBottomRight size={280} />
      </Animated.View>

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.content}>
          <View accessibilityRole="image" accessibilityLabel="Success">
            <AccountCreatedCheck width={95} height={75} />
          </View>
          <Animated.View style={[s.copy, copyStyle]}>
            <Text style={s.title}>Your account was created!</Text>
            <Text style={s.subtitle}>Let's give you a quick tour of the app!</Text>
          </Animated.View>
        </View>

        <Animated.View style={ctaStyle}>
          <AnimatedPressable
            style={s.continueBtn}
            onPress={() => {
              markOnboardingComplete();
              router.push('/home-tour');
            }}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={s.continueBtnText}>Continue</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
    overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute',
    left: -180,
    top: -160,
  },
  blobBR: {
    position: 'absolute',
    right: -140,
    bottom: -80,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 19,
    paddingBottom: 40,
  },
  copy: {
    alignItems: 'center',
    gap: 19,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textOnPrimarySoft,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    // Figma frame used border-outline (low contrast on primary); DS token for
    // text on green fills is color/text/on-primary.
    color: C.textOnPrimary,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: C.bgApp,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  continueBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.primary,
  },
});
