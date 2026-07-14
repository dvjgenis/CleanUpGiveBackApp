import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import { EmailReceiptIcon } from '../components/AccountIcons';
import { defaultOrderHistory, type OrderHistoryItem } from '../mocks/orderHistory';
import { layout, colors, fontFamilies, radius } from '../tokens';


function OrderCard({ order }: { order: OrderHistoryItem }) {
  return (
    <View style={[s.card, order.muted ? s.cardMuted : null]}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Text style={s.orderNumber}>{order.orderNumber}</Text>
          <Text style={s.orderDate}>{order.dateLabel}</Text>
        </View>
        <View style={s.statusTag}>
          <Text style={s.statusLabel}>{order.statusLabel}</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.productRow}>
        <Text style={s.productName}>{order.productName}</Text>
        <Text style={s.price}>{order.priceLabel}</Text>
      </View>

      <View style={s.receiptChip}>
        <EmailReceiptIcon width={16} height={16} />
        <Text style={s.receiptText}>Confirmation receipt sent to email</Text>
      </View>
    </View>
  );
}

/**
 * Order History (Figma `order_history`, node `854:116` / PRD §6.28).
 */
export function OrderHistoryScreen({ orders = defaultOrderHistory }: { orders?: OrderHistoryItem[] }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Order History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>Review your past equipment requests and purchases.</Text>

        <View style={s.list}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
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
  cardMuted: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  orderNumber: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  orderDate: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusTag: {
    height: 32,
    backgroundColor: colors.statusApprovedBg,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
    color: colors.statusApprovedText,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  productName: {
    flex: 1,
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  price: {
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
