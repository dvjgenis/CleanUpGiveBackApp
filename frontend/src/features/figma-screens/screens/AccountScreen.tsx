import React, { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { TrackerMapDarkIcon } from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { usePreferredName } from '@/features/onboarding/onboardingStore';
import {
  isSessionNotificationPermissionGranted,
  requestSessionNotificationPermission,
} from '@/utils/notificationPermissions';
import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
  requestSessionCameraPermission,
  requestSessionLocationPermission,
} from '@/utils/sessionPermissions';

import {
  AccountChevronIcon,
  ApprovalHistoryIcon,
  CameraAccessIcon,
  CopyrightIcon,
  DeleteAccountIcon,
  DonationHistoryIcon,
  ExportRecordIcon,
  GiveFeedbackIcon,
  LocationAccessIcon,
  LogOutIcon,
  NotificationsRowIcon,
  OrderHistoryIcon,
  PermissionsLockIcon,
  PreferencesIcon,
  PrivacyRowIcon,
  ProfileLeafLargeIcon,
  ProfileLeafSmallIcon,
  RecordsFolderIcon,
  RequestDataIcon,
  ShopBagIcon,
} from '../components/AccountIcons';
import { PersonalDetailsIcon, PersonalDetailsRowIcon } from '../components/PersonalDetailsIcon';
import { defaultAccountProfile, type AccountProfile } from '../mocks/account';
import { firstTimeHomeDashboard } from '../mocks/home';
import { layout, colors, fontFamilies, radius, shadows } from '../tokens';

/** Derives 1-2 letter avatar initials from a display name. */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}


type NavRowProps = {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
};

function AccountNavRow({ label, icon, onPress }: NavRowProps) {
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={s.navRow}
    >
      <View style={s.navRowLeading}>
        <View style={s.navRowIcon}>{icon}</View>
        <Text style={s.navRowLabel}>{label}</Text>
      </View>
      <AccountChevronIcon width={16} height={16} />
    </AnimatedPressable>
  );
}

type ToggleRowProps = {
  label: string;
  icon: ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function AccountToggleRow({ label, icon, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={s.navRow}>
      <View style={s.navRowLeading}>
        <View style={s.navRowIcon}>{icon}</View>
        <Text style={s.navRowLabel}>{label}</Text>
      </View>
      <SessionSetupToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

type SectionCardProps = {
  title: string;
  headerIcon: ReactNode;
  children: ReactNode;
};

function SectionCard({ title, headerIcon, children }: SectionCardProps) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        {headerIcon}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function AccountTopAppBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarTitleRow}>
        <Text style={s.topBarTitle}>Account</Text>
      </View>
    </View>
  );
}

function ProfileHero({ profile }: { profile: AccountProfile }) {
  return (
    <View style={s.profileHero}>
      {/* Figma ProfileHero leaves (569:917 / 569:918) — absolute, rotated, clipped by overflow */}
      <View style={s.profileLeafLarge} pointerEvents="none">
        <View style={s.profileLeafLargeRotate}>
          <ProfileLeafLargeIcon width={58} height={58} />
        </View>
      </View>
      <View style={s.profileLeafSmall} pointerEvents="none">
        <View style={s.profileLeafSmallRotate}>
          <ProfileLeafSmallIcon width={40} height={40} />
        </View>
      </View>

      <View style={s.profileTopRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile.initials}</Text>
        </View>
        <View style={s.profileNameCol}>
          <Text style={s.profileName}>{profile.displayName}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.statusPendingText }]}>{profile.totalHoursLabel}</Text>
          <Text style={s.statLabel}>Total Hours</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.primary }]}>{profile.approvedHoursLabel}</Text>
          <Text style={s.statLabel}>Approved</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statValue, { color: colors.textPrimary }]}>{profile.sessionsLabel}</Text>
          <Text style={s.statLabel}>Sessions</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Account tab (Figma `account`, node `569:896`).
 * Icons load from `frontend/assets/figma/account/*.svg`.
 */
export function AccountScreen({ profile = defaultAccountProfile }: { profile?: AccountProfile }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();
  const [cameraAccess, setCameraAccess] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const [notificationsAccess, setNotificationsAccess] = useState(false);
  const preferredName = usePreferredName();

  // Same name shown in the Home greeting, so Account stays in sync with it.
  const displayName = preferredName || firstTimeHomeDashboard.homeUser.firstName;
  const heroProfile: AccountProfile = {
    ...profile,
    displayName,
    initials: getInitials(displayName),
  };

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + 48;

  // Mirror the real OS permission status every time this screen is focused —
  // e.g. after the user grants/revokes access in the iOS Settings app and
  // comes back.
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      void isSessionCameraPermissionGranted().then((granted) => {
        if (isMounted) setCameraAccess(granted);
      });
      void isSessionLocationPermissionGranted().then((granted) => {
        if (isMounted) setLocationAccess(granted);
      });
      void isSessionNotificationPermissionGranted().then((granted) => {
        if (isMounted) setNotificationsAccess(granted);
      });

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const promptOpenSettings = useCallback((label: string) => {
    Alert.alert(
      `${label} access is off`,
      `To turn ${label.toLowerCase()} on, enable it for Expo Go in iOS Settings. The system permission dialog only appears the first time — after that, Settings is the only way to change it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
  }, []);

  const handleCameraAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        // App cannot revoke OS permission — flip UI off and send user to Settings.
        setCameraAccess(false);
        promptOpenSettings('Camera');
        return;
      }

      const result = await requestSessionCameraPermission();
      setCameraAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Camera');
      }
    },
    [promptOpenSettings],
  );

  const handleLocationAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        setLocationAccess(false);
        promptOpenSettings('Location');
        return;
      }

      const result = await requestSessionLocationPermission();
      setLocationAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Location');
      }
    },
    [promptOpenSettings],
  );

  const handleNotificationsAccessChange = useCallback(
    async (value: boolean) => {
      if (!value) {
        setNotificationsAccess(false);
        promptOpenSettings('Notifications');
        return;
      }

      const result = await requestSessionNotificationPermission();
      setNotificationsAccess(result.granted);
      if (!result.granted) {
        promptOpenSettings('Notifications');
      }
    },
    [promptOpenSettings],
  );

  return (
    <View style={s.root}>
      <AccountTopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero profile={heroProfile} />

        <View style={s.sections}>
          <SectionCard
            title="Personal Details"
            headerIcon={<PersonalDetailsIcon width={15} height={15} color={colors.textPrimary} />}
          >
            <AccountNavRow
              label="Edit Personal Details"
              icon={<PersonalDetailsRowIcon width={16} height={16} />}
              onPress={() => router.push('/personal-details' as Href)}
            />
          </SectionCard>

          <SectionCard title="Records" headerIcon={<RecordsFolderIcon width={17} height={14} />}>
            <AccountNavRow
              label="Export Service Record"
              icon={<ExportRecordIcon />}
              onPress={() => router.push('/export-service-record' as Href)}
            />
            <AccountNavRow
              label="Approval History"
              icon={<ApprovalHistoryIcon />}
              onPress={() => router.push('/approval-history' as Href)}
            />
            <AccountNavRow
              label="Request Data"
              icon={<RequestDataIcon />}
              onPress={() => router.push('/request-data' as Href)}
            />
          </SectionCard>

          <SectionCard title="Shop" headerIcon={<ShopBagIcon width={24} height={24} />}>
            <AccountNavRow
              label="Order History"
              icon={<OrderHistoryIcon />}
              onPress={() => router.push('/order-history' as Href)}
            />
            <AccountNavRow
              label="Donation History"
              icon={<DonationHistoryIcon />}
              onPress={() => router.push('/donation-history' as Href)}
            />
          </SectionCard>

          <SectionCard title="Preferences" headerIcon={<PreferencesIcon />}>
            <AccountNavRow
              label="Notifications"
              icon={<NotificationsRowIcon />}
              onPress={() => router.push('/notifications' as Href)}
            />
            <AccountNavRow
              label="Privacy"
              icon={<PrivacyRowIcon />}
              onPress={() => router.push('/privacy-policy' as Href)}
            />
            <AccountNavRow
              label="Map Theme"
              icon={<TrackerMapDarkIcon color={colors.textTertiary} size={18} />}
              onPress={() => router.push('/map-theme' as Href)}
            />
          </SectionCard>

          <SectionCard title="Permissions" headerIcon={<PermissionsLockIcon width={24} height={24} />}>
            <AccountToggleRow
              label="Camera Access"
              icon={<CameraAccessIcon />}
              value={cameraAccess}
              onValueChange={handleCameraAccessChange}
            />
            <AccountToggleRow
              label="Location Access"
              icon={<LocationAccessIcon />}
              value={locationAccess}
              onValueChange={handleLocationAccessChange}
            />
            <AccountToggleRow
              label="Notifications"
              icon={<NotificationsRowIcon />}
              value={notificationsAccess}
              onValueChange={handleNotificationsAccessChange}
            />
          </SectionCard>

          <View style={s.feedbackCard}>
            <AccountNavRow
              label="Give Feedback"
              icon={<GiveFeedbackIcon />}
              onPress={() => router.push('/give-feedback' as Href)}
            />
          </View>
        </View>

        <View style={s.actions}>
          <AnimatedPressable
            scaleTo={0.98}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Log Out"
            style={s.logOutBtn}
          >
            <LogOutIcon width={24} height={24} />
            <Text style={s.logOutLabel}>Log Out</Text>
          </AnimatedPressable>

          <AnimatedPressable
            scaleTo={0.98}
            onPress={() => router.push('/delete-account-confirm' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
            style={s.deleteBtn}
          >
            <DeleteAccountIcon width={24} height={24} />
            <Text style={s.deleteLabel}>Delete Account</Text>
          </AnimatedPressable>
        </View>

        <View style={s.copyrightRow}>
          <CopyrightIcon width={16} height={16} />
          <Text style={s.copyrightText}>CleanUpGiveBack</Text>
        </View>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => router.push('/shop' as Href)}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => router.push('/sessions-list' as Href)}
          onProfilePress={() => {}}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topBar: {
    backgroundColor: colors.white,
  },
  topBarTitleRow: {
    minHeight: layout.topBarTitleRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  profileHero: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 19,
    paddingTop: 19,
    paddingBottom: 16,
    overflow: 'hidden',
    minHeight: 171,
  },
  // Figma 569:917 — wrapper 70.5×70.5 at top≈-16 / right≈-7, icon 57.6 rotated −75°
  profileLeafLarge: {
    position: 'absolute',
    top: -16,
    right: -7,
    width: 71,
    height: 71,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLeafLargeRotate: {
    transform: [{ rotate: '-75deg' }],
  },
  // Figma 569:918 — wrapper 56.8×56.8 at top≈23 / right≈-9, icon 40.3 rotated −50°
  profileLeafSmall: {
    position: 'absolute',
    top: 23,
    right: -9,
    width: 57,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLeafSmallRotate: {
    transform: [{ rotate: '-50deg' }],
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textOnPrimary,
  },
  profileNameCol: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  sections: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 21,
    gap: 16,
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 21,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  sectionBody: {
    gap: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  navRowLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navRowIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    gap: 12,
    paddingTop: 16,
  },
  logOutBtn: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logOutLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  deleteBtn: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  deleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  copyrightText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
