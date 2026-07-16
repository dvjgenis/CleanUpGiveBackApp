import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  NotifApprovalIcon,
  NotifBellIcon,
  NotifEventsIcon,
  NotifPhotoIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { type ComponentType, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestSessionNotificationPermission } from '@/utils/notificationPermissions';

const PREFS: { key: string; label: string; Icon: ComponentType<{ color?: string }> }[] = [
  { key: 'approval', label: 'Approval Updates', Icon: NotifApprovalIcon },
  { key: 'photo', label: 'Photo Alerts', Icon: NotifPhotoIcon },
  { key: 'events', label: 'New Events', Icon: NotifEventsIcon },
  { key: 'reminders', label: 'Session Reminders', Icon: NotifBellIcon },
];

function PreferenceChip({
  label,
  Icon,
}: {
  label: string;
  Icon: ComponentType<{ color?: string }>;
}) {
  return (
    <View
      style={s.prefChip}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={s.prefInner}>
        <Icon color={C.primary} />
        <Text style={s.prefLabel}>{label}</Text>
      </View>
    </View>
  );
}

/** Figma `notif_account` (112:7130) — onboarding step 5 of 5. */
export function NotificationPreferenceScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const finish = () => router.push('/setup-complete');

  const handleEnable = async () => {
    if (isRequesting) {
      return;
    }
    setIsRequesting(true);
    try {
      const result = await requestSessionNotificationPermission();
      if (!result.granted && !result.canAskAgain) {
        Alert.alert(
          'Notifications are off',
          'Enable Notifications for Expo Go in Settings to get alerts.',
          [
            { text: 'Not now', style: 'cancel', onPress: finish },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    } finally {
      setIsRequesting(false);
    }
    finish();
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.content}>
          <View style={s.main}>
            <OnboardingProgressPills active={5} />
            <View style={s.titleSection}>
              <View style={s.titleRow}>
                <Text style={s.title}>Stay updated</Text>
                <NotifBellIcon size={24} />
              </View>
              <Text style={s.subtitle}>
                Get alerts about approvals, events, and photo checkpoints.
              </Text>
            </View>
            <View style={s.prefList}>
              {PREFS.map(({ key, label, Icon }) => (
                <PreferenceChip key={key} label={label} Icon={Icon} />
              ))}
            </View>
          </View>

          <View style={s.footer}>
            <AnimatedPressable
              style={[s.enableBtn, isRequesting && s.enableBtnDisabled]}
              onPress={handleEnable}
              disabled={isRequesting}
              accessibilityRole="button"
              accessibilityLabel="Enable notifications"
            >
              <Text style={s.enableBtnText}>
                {isRequesting ? 'Requesting…' : 'Enable notifications'}
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
              onPress={finish}
              disabled={isRequesting}
              accessibilityRole="button"
              accessibilityLabel="Not now"
            >
              <Text style={s.notNowText}>Not now</Text>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  main: {
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 22,
  },
  prefList: {
    width: '100%',
    gap: 26,
  },
  prefChip: {
    alignSelf: 'stretch',
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: C.borderOutline,
    backgroundColor: C.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.textPrimary,
  },
  footer: {
    gap: 20,
  },
  enableBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
