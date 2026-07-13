import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import { AccountChevronIcon, CopyrightIcon } from '../components/AccountIcons';
import { colors, fontFamilies, shadows } from '../tokens';

const BOTTOM_NAV_HEIGHT = 64;

type PolicyRowProps = {
  title: string;
  description: string;
  onPress: () => void;
};

function PolicyRow({ title, description, onPress }: PolicyRowProps) {
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={s.policyRow}
    >
      <View style={s.policyRowText}>
        <Text style={s.policyRowTitle}>{title}</Text>
        <Text style={s.policyRowDesc}>{description}</Text>
      </View>
      <View style={s.policyRowChevron}>
        <AccountChevronIcon width={16} height={16} />
      </View>
    </AnimatedPressable>
  );
}

/**
 * Privacy Policy index (Figma `privacy_policy`, node `728:995` / PRD §6.31).
 * Lists five sections; each navigates to a detail screen.
 */
export function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + BOTTOM_NAV_HEIGHT + 48;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Privacy Policy" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.headline}>Privacy Policy</Text>
          <Text style={s.lastUpdated}>Last updated: June 30, 2026</Text>
        </View>

        <View style={s.rows}>
          <PolicyRow
            title="What we collect"
            description="We collect photos, location, and account details during sessions to verify your service hours."
            onPress={() => router.push('/privacy-what-we-collect' as Href)}
          />
          <PolicyRow
            title="How we use it"
            description="Your data helps us verify cleanup work, process payments, and keep the app running safely."
            onPress={() => router.push('/privacy-how-we-use-it' as Href)}
          />
          <PolicyRow
            title="Who we share it with"
            description="We may share your information with partners and service providers to enhance service delivery."
            onPress={() => router.push('/privacy-who-we-share-it-with' as Href)}
          />
          <PolicyRow
            title="How we protect it"
            description="We implement strong security measures to protect your data from unauthorized access."
            onPress={() => router.push('/privacy-how-we-protect-it' as Href)}
          />

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
          onProfilePress={() => router.replace('/account' as Href)}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 22,
  },
  header: {
    gap: 12,
  },
  headline: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
  },
  lastUpdated: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  rows: {
    gap: 20,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyRowText: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  policyRowTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  policyRowDesc: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  policyRowChevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 28,
    paddingBottom: 8,
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
