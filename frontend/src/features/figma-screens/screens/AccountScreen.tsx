import React, { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import {
  AccountChevronIcon,
  ApprovalHistoryIcon,
  CameraAccessIcon,
  CopyrightIcon,
  DeleteAccountIcon,
  DonationHistoryIcon,
  ExportRecordIcon,
  LocationAccessIcon,
  LogOutIcon,
  NotificationsRowIcon,
  OrderHistoryIcon,
  PermissionsLockIcon,
  PreferencesIcon,
  PrivacyRowIcon,
  ProfileLeavesIcon,
  RecordsFolderIcon,
  RequestDataIcon,
  ShopBagIcon,
} from '../components/AccountIcons';
import { defaultAccountProfile, type AccountProfile } from '../mocks/account';
import { colors, fontFamilies, radius, shadows } from '../tokens';

const BOTTOM_NAV_HEIGHT = 64;
const TOP_BAR_TITLE_ROW = 44;
const TOP_BAR_PADDING_BOTTOM = 8.5;

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
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: TOP_BAR_PADDING_BOTTOM }]}>
      <View style={s.topBarTitleRow}>
        <Text style={s.topBarTitle}>Account</Text>
      </View>
    </View>
  );
}

function ProfileHero({ profile }: { profile: AccountProfile }) {
  return (
    <View style={s.profileHero}>
      <View style={s.profileLeaves} pointerEvents="none">
        <ProfileLeavesIcon width={71} height={88} />
      </View>

      <View style={s.profileTopRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile.initials}</Text>
        </View>
        <View style={s.profileNameCol}>
          <Text style={s.profileName}>{profile.displayName}</Text>
          <Text style={s.profileEmail}>{profile.email}</Text>
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
  const [cameraAccess, setCameraAccess] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + BOTTOM_NAV_HEIGHT + 48;

  return (
    <View style={s.root}>
      <AccountTopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero profile={profile} />

        <View style={s.sections}>
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
          </SectionCard>

          <SectionCard title="Permissions" headerIcon={<PermissionsLockIcon width={24} height={24} />}>
            <AccountToggleRow
              label="Camera Access"
              icon={<CameraAccessIcon />}
              value={cameraAccess}
              onValueChange={setCameraAccess}
            />
            <AccountToggleRow
              label="Location Access"
              icon={<LocationAccessIcon />}
              value={locationAccess}
              onValueChange={setLocationAccess}
            />
          </SectionCard>
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
    minHeight: TOP_BAR_TITLE_ROW,
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
  profileLeaves: {
    position: 'absolute',
    top: -18,
    right: 4,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 56,
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
