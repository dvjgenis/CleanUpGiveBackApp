import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { staggerDelay } from '@/motion';
import { goToSessionSetupStep5 } from '@/utils/sessionSetupGuideNavigation';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
  requestSessionLocationPermission,
} from '@/utils/sessionPermissions';
import { colors as C } from '@/constants/tokens';

/** PRD §6.10 · Figma `location_permission` (728:639) — session setup guide step 6. */
export function SessionSetupStep6Screen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  /** 8 when camera is still ahead; 9 when camera will auto-skip (finale next). */
  const [activePills, setActivePills] = useState(8);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  const goToCameraPermission = useCallback(() => {
    router.push('/session-setup-step7');
  }, [router]);

  // Location was already granted (e.g. during onboarding) — nothing to ask,
  // skip straight to the camera permission step.
  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      isSessionLocationPermissionGranted(),
      isSessionCameraPermissionGranted(),
    ])
      .then(([locationGranted, cameraGranted]) => {
        if (!isMounted) {
          return;
        }
        if (locationGranted) {
          router.replace('/session-setup-step7');
          return;
        }
        setActivePills(cameraGranted ? 9 : 8);
        setIsCheckingPermission(false);
      })
      .catch(() => {
        if (isMounted) {
          setIsCheckingPermission(false);
        }
      });

    return () => {
      isMounted = false;
    };
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

  if (!fontsLoaded || isCheckingPermission) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <View style={s.navSection}>
        <OnboardingProgressPills total={10} active={activePills} />
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

      <SessionSetupGuideFooterActions
        continueLabel={isRequesting ? 'Requesting…' : 'Enable location'}
        skipLabel="Not now"
        disabled={isRequesting}
        onContinuePress={() => {
          void handleEnableLocation();
        }}
        onPreviousPress={() => goToSessionSetupStep5(router)}
        onSkipPress={goToCameraPermission}
      />

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
});
