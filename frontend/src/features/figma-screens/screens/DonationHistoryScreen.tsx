import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import { DonateCardIcon, EmailReceiptIcon } from '../components/AccountIcons';
import { defaultDonationHistory, type DonationHistoryItem } from '../mocks/donationHistory';
import { colors, fontFamilies, radius } from '../tokens';

const BOTTOM_NAV_HEIGHT = 64;

function DonationCard({ donation }: { donation: DonationHistoryItem }) {
  return (
    <View style={s.card}>
      <Text style={s.dateLabel}>{donation.dateLabel}</Text>

      <View style={s.divider} />

      <View style={s.amountRow}>
        <View style={s.donationLabelRow}>
          <Text style={s.donationLabel}>Donation</Text>
          <DonateCardIcon width={24} height={24} />
        </View>
        <Text style={s.amount}>{donation.amountLabel}</Text>
      </View>

      <View style={s.receiptChip}>
        <EmailReceiptIcon width={16} height={16} />
        <Text style={s.receiptText}>Confirmation sent to email</Text>
      </View>
    </View>
  );
}

/**
 * Donation History (Figma `donation_history`, node `854:205` / PRD §6.29).
 */
export function DonationHistoryScreen({
  donations = defaultDonationHistory,
}: {
  donations?: DonationHistoryItem[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + BOTTOM_NAV_HEIGHT + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Donation History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Thank you for supporting clean-up efforts. Review your past donations below.
        </Text>

        <View style={s.list}>
          {donations.map((donation) => (
            <DonationCard key={donation.id} donation={donation} />
          ))}
        </View>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => {}}
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
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 24,
    gap: 16,
  },
  dateLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  donationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donationLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  amount: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  receiptChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  receiptText: {
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
