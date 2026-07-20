import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { ONBOARDING_GRAPHICS } from '@/components/onboarding/onboardingGraphics';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  totalPills: number;
  activePills: number;
  onContinue: () => void;
  onPrevious: () => void;
  onSkip: () => void;
};

/** Figma `disclaimer` (1125:360) — "One free hour!" info screen used in onboarding and session setup. */
export function FreeHourScreen({ totalPills, activePills, onContinue, onPrevious, onSkip }: Props) {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Absolute graphic sits behind title + footer, matching camera/location permission screens. */}
      <View style={s.illustration} pointerEvents="none">
        <ExpoImage
          source={ONBOARDING_GRAPHICS.freeHourGraphic}
          style={s.graphic}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      <View style={s.main}>
        <View style={s.navSection}>
          <OnboardingProgressPills active={activePills} total={totalPills} />
        </View>

        <View style={s.titleSection}>
          <Text style={s.title}>One free hour!</Text>
          <Text style={s.subtitle}>
            When you start tracking, you get the chance to explore the tracker for 1 hour before paying.
          </Text>
        </View>
      </View>

      <OnboardingInfoFooterActions
        onContinue={onContinue}
        onPrevious={onPrevious}
        onSkip={onSkip}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
    overflow: 'hidden',
  },
  /**
   * Absolute phone graphic behind the mid-screen content + footer — same layering
   * pattern as `CameraPermissionScreen` / `LocationPermissionScreen`. Sized under
   * the previous 336×560 (and under Figma’s 280×467) so the title stays clear.
   */
  illustration: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    alignItems: 'center',
  },
  graphic: {
    width: 288,
    height: 480,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 30,
  },
  navSection: {
    gap: 20,
  },
  titleSection: {
    gap: 17,
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
    lineHeight: 22,
  },
});
