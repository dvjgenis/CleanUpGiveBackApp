import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';

import { DonateCardIcon } from '../components/AccountIcons';
import { EmailReceiptChip } from '../components/EmailReceiptChip';
import { defaultDonationHistory, type DonationHistoryItem } from '../mocks/donationHistory';
import { colors, fontFamilies, radius } from '../tokens';


function DonationCard({ donation }: { donation: DonationHistoryItem }) {
  const timestampLabel = donation.timeLabel
    ? `${donation.dateLabel} · ${donation.timeLabel}`
    : donation.dateLabel;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text
          style={s.timestamp}
          accessibilityLabel={`Donated ${timestampLabel}`}
        >
          {timestampLabel}
        </Text>
      </View>

      <View style={s.divider} />

      <View style={s.amountRow}>
        <View style={s.donationLabelRow}>
          <Text style={s.donationLabel}>Donation</Text>
          <DonateCardIcon width={24} height={24} />
        </View>
        <Text style={s.amount}>{donation.amountLabel}</Text>
      </View>

      <EmailReceiptChip label="Confirmation sent to email" />
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

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + 32;

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

        {donations.length === 0 ? (
          <EmptyState
            title="No donations yet"
            body="Make a donation to support clean-up efforts."
            ctaLabel="Make a Donation"
            ctaAccessibilityLabel="Make a donation"
            onCtaPress={() => router.push('/donate' as Href)}
          />
        ) : (
          <View style={s.list}>
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </View>
        )}
      </ScrollView>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
    textAlign: 'right',
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
});
