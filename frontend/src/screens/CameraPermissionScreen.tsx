import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CameraPermissionIllustration } from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import { requestSessionCameraPermission } from '@/utils/sessionPermissions';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `camera_permission` (725:613) — onboarding step 4 of 5. */
export function CameraPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  async function handleEnable() {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestSessionCameraPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Camera access is off',
          'Enable Camera for Expo Go in Settings to continue using photo checkpoints.',
          [
            {
              text: 'Not now',
              style: 'cancel',
              onPress: () => router.push('/notification-preference'),
            },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    } finally {
      setIsRequesting(false);
    }
    router.push('/notification-preference');
  }

  function handleNotNow() {
    router.push('/notification-preference');
  }

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.illustration} pointerEvents="none">
        <CameraPermissionIllustration />
      </View>

      <View style={s.flex}>
        <View style={s.main}>
          <OnboardingProgressPills active={4} />
          <View style={s.titleSection}>
            <Text style={s.title} accessibilityRole="header">
              Allow camera?
            </Text>
            <Text style={s.subtitle}>
              Camera access is required for photo checkpoints during sessions.
            </Text>
          </View>
        </View>

        <View style={s.footer}>
          <AnimatedPressable
            style={[s.enableBtn, isRequesting && { opacity: 0.7 }]}
            onPress={handleEnable}
            disabled={isRequesting}
            accessibilityRole="button"
            accessibilityLabel="Enable camera"
          >
            <Text style={s.enableBtnText}>
              {isRequesting ? 'Requesting…' : 'Enable camera'}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.previousBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Previous"
          >
            <Text style={s.previousBtnText}>Previous</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={s.notNowBtn}
            onPress={handleNotNow}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={s.notNowText}>Not now</Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
    justifyContent: 'space-between',
  },
  illustration: {
    position: 'absolute',
    left: '40.77%',
    top: '16%',
    width: 240,
    height: 210,
  },
  main: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 30,
  },
  titleSection: {
    gap: 15,
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
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 20,
  },
  enableBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  enableBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.textPrimary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previousBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textPrimary,
  },
  notNowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  notNowText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
});
