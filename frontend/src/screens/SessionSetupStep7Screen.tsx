import { CoachmarkEnter } from '@/components/motion/CoachmarkEnter';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupGuideFooterActions } from '@/components/session-setup/SessionSetupGuideFooterActions';
import { staggerDelay } from '@/motion';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
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
  requestSessionCameraPermission,
} from '@/utils/sessionPermissions';
import { colors as C } from '@/constants/tokens';

/** PRD §6.10 · Figma `camera_permission` (728:658) — session setup guide step 7. */
export function SessionSetupStep7Screen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  const goToComplete = useCallback(() => {
    router.push('/session-setup-complete');
  }, [router]);

  // Camera was already granted (e.g. during onboarding) — nothing to ask,
  // skip straight to the session-setup-complete step.
  useEffect(() => {
    let isMounted = true;

    void isSessionCameraPermissionGranted()
      .then((granted) => {
        if (!isMounted) {
          return;
        }
        if (granted) {
          router.replace('/session-setup-complete');
          return;
        }
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

  const handleEnableCamera = useCallback(async () => {
    if (isRequesting) {
      return;
    }

    setIsRequesting(true);
    try {
      await requestSessionCameraPermission();
    } finally {
      setIsRequesting(false);
      goToComplete();
    }
  }, [goToComplete, isRequesting]);

  if (!fontsLoaded || isCheckingPermission) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      <View style={s.navSection}>
        <OnboardingProgressPills total={10} active={9} />
      </View>

      <CoachmarkEnter style={s.main}>
        <Image
          source={require('../../assets/images/screens/permissions/camera-graphic.png')}
          style={s.decorativeCamera}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <CoachmarkEnter delayMs={staggerDelay(1)} style={s.headingContainer}>
          <Text style={s.title}>Allow camera?</Text>
          <Text style={s.subtitle}>
            Camera access is required for photo checkpoints during sessions.
          </Text>
        </CoachmarkEnter>
      </CoachmarkEnter>

      <SessionSetupGuideFooterActions
        continueLabel={isRequesting ? 'Requesting…' : 'Enable camera'}
        skipLabel="Not now"
        disabled={isRequesting}
        onContinuePress={() => {
          void handleEnableCamera();
        }}
        onPreviousPress={() => goBackInSessionSetupGuide(router)}
        onSkipPress={goToComplete}
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

  decorativeCamera: {
    position: 'absolute',
    right: -24,
    top: 20,
    width: 228,
    height: 206,
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
