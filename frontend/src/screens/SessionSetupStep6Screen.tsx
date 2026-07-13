import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { staggerDelay } from '@/motion';
import { goToSessionSetupStep5 } from '@/utils/sessionSetupGuideNavigation';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { requestSessionLocationPermission } from '@/utils/sessionPermissions';
import { colors as C } from '@/constants/tokens';


function ProgressPills({ total = 6, active = 5 }: { total?: number; active?: number }) {
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

/** PRD §6.10 · Figma `location_permission` (728:639) — session setup guide step 6. */
export function SessionSetupStep6Screen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  const goToCameraPermission = useCallback(() => {
    router.push('/session-setup-step7');
  }, [router]);

  const handleEnableLocation = useCallback(async () => {
    if (isRequesting) {
      return;
    }

    setIsRequesting(true);
    try {
      await requestSessionLocationPermission();
    } finally {
      setIsRequesting(false);
      goToCameraPermission();
    }
  }, [goToCameraPermission, isRequesting]);

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <View style={s.navSection}>
        <AnimatedPressable
          style={s.backBtn}
          onPress={() => goToSessionSetupStep5(router)}
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
        <ProgressPills total={6} active={5} />
      </View>

      <CoachmarkEnter style={s.main}>
        <Image
          source={require('../../assets/images/screens/permissions/location-pin.png')}
          style={s.decorativePin}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <CoachmarkEnter delayMs={staggerDelay(1)} style={s.headingContainer}>
          <Text style={s.title}>Allow location?</Text>
          <Text style={s.subtitle}>
            Location is used only during active cleanup sessions to verify your route.
          </Text>
        </CoachmarkEnter>
      </CoachmarkEnter>

      <View style={s.actions}>
        <AnimatedPressable
          style={[s.enableBtn, isRequesting && s.enableBtnDisabled]}
          onPress={handleEnableLocation}
          disabled={isRequesting}
        >
          <Text style={s.enableBtnText}>{isRequesting ? 'Requesting…' : 'Enable location'}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={s.previousBtn}
          onPress={() => goToSessionSetupStep5(router)}
        >
          <Text style={s.previousBtnText}>Previous</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={s.notNowBtn}
          onPress={goToCameraPermission}
          disabled={isRequesting}
        >
          <Text style={s.notNowText}>Not now</Text>
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

  navSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
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

  main: {
    flex: 1,
    paddingHorizontal: 16,
  },

  decorativePin: {
    position: 'absolute',
    right: -32,
    top: 28,
    width: 190,
    height: 256,
    opacity: 0.75,
  },

  headingContainer: {
    marginTop: 42,
    gap: 15,
    maxWidth: 280,
    zIndex: 1,
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

  actions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 20,
  },

  enableBtn: {
    height: 56,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableBtnDisabled: {
    opacity: 0.7,
  },
  enableBtnText: {
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

  notNowBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },
});
