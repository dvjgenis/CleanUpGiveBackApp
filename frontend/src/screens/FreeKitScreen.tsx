import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  totalPills: number;
  activePills: number;
  onContinue: () => void;
  onPrevious: () => void;
  onSkip: () => void;
};

/** Figma `free_kit` (1126:451) — "$49.99 free cleanup kit" screen used in onboarding and session setup. */
export function FreeKitScreen({ totalPills, activePills, onContinue, onPrevious, onSkip }: Props) {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.main}>
        <View style={s.navSection}>
          <OnboardingProgressPills active={activePills} total={totalPills} />
        </View>

        <View style={s.titleSection}>
          <Text style={s.title}>Free cleanup kit!</Text>
          <Text style={s.subtitle}>
            {'After paying a one-time $49.99 fee, you will have access to unlimited tracking and '}
            <Text style={s.subtitleBold}>we will ship you a free cleanup kit!</Text>
          </Text>
        </View>

        <View style={s.graphicContainer}>
          <Image
            source={require('../../assets/images/screens/onboarding/free-kit-graphic.png')}
            style={s.graphic}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
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
  subtitleBold: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: C.primary,
    lineHeight: 22,
  },
  graphicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 280,
  },
  graphic: {
    width: '100%',
    height: 260,
  },
});
