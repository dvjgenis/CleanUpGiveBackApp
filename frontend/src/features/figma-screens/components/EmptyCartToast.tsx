import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';

import { useAttentionShake } from '@/components/motion/hooks';

import { useCartItemCount } from '../cartStore';
import { colors, fontFamilies, radius, shadows } from '../tokens';

type EmptyCartToastProps = {
  visible: boolean;
};

/** Session-setup-style toast when the cart icon is tapped with an empty cart. */
export function EmptyCartToast({ visible }: EmptyCartToastProps) {
  const shakeStyle = useAttentionShake();

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.toast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.toastTitle}>Your cart is empty</Text>
      <Text style={s.toastLine}>Add an item from the shop first</Text>
    </Animated.View>
  );
}

/**
 * Cart icon press: navigate to `/cart` when there are items; otherwise show toast.
 */
export function useCartIconPress(autoHideMs = 2800) {
  const router = useRouter();
  const cartCount = useCartItemCount();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timer = setTimeout(() => setToastVisible(false), autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, toastKey, toastVisible]);

  const onCartPress = () => {
    if (cartCount <= 0) {
      setToastKey((key) => key + 1);
      setToastVisible(true);
      return;
    }
    setToastVisible(false);
    router.push('/cart' as Href);
  };

  return { cartCount, onCartPress, toastVisible, toastKey };
}

const s = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.statusApprovedBorder,
    gap: 4,
    zIndex: 20,
    ...shadows.barTop,
  },
  toastTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  toastLine: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textNavInactive,
  },
});
