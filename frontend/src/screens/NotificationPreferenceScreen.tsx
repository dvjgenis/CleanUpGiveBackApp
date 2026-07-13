import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  NotifApprovalIcon,
  NotifBellIcon,
  NotifEventsIcon,
  NotifPhotoIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C, radius } from '@/features/figma-screens/tokens';
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
import { type ComponentType } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


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

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const finish = () => router.push('/setup-complete');

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <OnboardingProgressPills active={5} />
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

        <View style={s.actions}>
          <AnimatedPressable
            style={s.primaryBtn}
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Enable notifications"
          >
            <Text style={s.primaryBtnText}>Enable notifications</Text>
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
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={s.notNowText}>Not now</Text>
          </AnimatedPressable>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 49,
  },
  header: {
    gap: 30,
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
    borderRadius: radius.md,
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
  actions: {
    gap: 20,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.textPrimary,
    borderRadius: radius.md,
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
    paddingVertical: 20,
  },
  notNowText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
});
