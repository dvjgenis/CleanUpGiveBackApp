import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import {
  LiveSessionMinimizedBar,
  useLiveSessionNavChrome,
} from '@/components/navigation/LiveSessionNavChrome';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getUserOrders } from '@/lib/shopOrders';

import { EmailReceiptChip } from '../components/EmailReceiptChip';
import {
  mapShopOrderToHistoryItem,
  type OrderHistoryItem,
} from '../mocks/orderHistory';
import { layout, colors, fontFamilies, radius } from '../tokens';


function OrderCard({ order }: { order: OrderHistoryItem }) {
  const muted = order.muted ?? false;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Text style={s.orderNumber}>{order.orderNumber}</Text>
          <Text style={s.orderDate}>{order.dateLabel}</Text>
        </View>
        <View style={s.statusTag}>
          <Text style={[s.statusLabel, muted ? s.statusLabelMuted : null]}>
            {order.statusLabel}
          </Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.productRow}>
        <View style={s.productCopy}>
          <Text style={s.productName}>{order.productName}</Text>
          <Text style={s.receivingLabel}>{order.receivingLabel}</Text>
        </View>
        <Text style={[s.price, muted ? s.priceMuted : null]}>{order.priceLabel}</Text>
      </View>

      {order.trackingUrl ? (
        <Pressable
          onPress={() => {
            void Linking.openURL(order.trackingUrl!);
          }}
          accessibilityRole="link"
          accessibilityLabel="Track package"
          style={s.trackBtn}
        >
          <Text style={s.trackBtnText}>Track package</Text>
        </Pressable>
      ) : null}

      <EmailReceiptChip />
    </View>
  );
}

/**
 * Order History (Figma `order_history`, node `854:116` / PRD §6.28).
 */
export function OrderHistoryScreen({ orders: ordersProp }: { orders?: OrderHistoryItem[] }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, onTrackPress, expandLiveSession, barStyle, barExtraHeight } =
    useLiveSessionNavChrome();
  const [liveOrders, setLiveOrders] = useState<OrderHistoryItem[] | null>(
    ordersProp ?? null,
  );

  useEffect(() => {
    if (ordersProp) {
      setLiveOrders(ordersProp);
      return;
    }
    let cancelled = false;
    void getUserOrders().then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setLiveOrders([]);
        return;
      }
      setLiveOrders(result.orders.map(mapShopOrderToHistoryItem));
    });
    return () => {
      cancelled = true;
    };
  }, [ordersProp]);

  const orders = liveOrders ?? [];
  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + barExtraHeight + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Order History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {liveOrders === null ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingLabel}>Loading order history…</Text>
          </View>
        ) : (
          <>
        <Text style={s.intro}>Review your past equipment requests and purchases.</Text>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="Browse the shop to request cleanup gear."
            ctaLabel="Browse Shop"
            ctaAccessibilityLabel="Go to shop"
            onCtaPress={() =>
              router.push({ pathname: '/shop', params: { enter: 'fade' } } as Href)
            }
          />
        ) : (
          <View style={s.list}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
          </>
        )}
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        {isActive && (
          <LiveSessionMinimizedBar barStyle={barStyle} onExpand={expandLiveSession} />
        )}
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={onTrackPress}
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
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
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
  statusLabelMuted: {
    color: colors.textNavInactive,
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
  productCopy: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  receivingLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    color: colors.textNavInactive,
  },
  price: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
    color: colors.primary,
  },
  priceMuted: {
    color: colors.textNavInactive,
  },
  trackBtn: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 13,
    color: colors.white,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
