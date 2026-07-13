import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAttentionShake } from '@/components/motion/hooks';

import { colors, fontFamilies, radius, shadows } from '../tokens';

type Props = {
  visible: boolean;
};

/** Session-setup-style toast confirming a link was copied to the clipboard. */
export function LinkCopiedToast({ visible }: Props) {
  const shakeStyle = useAttentionShake();

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.toast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.toastTitle}>Link has been copied</Text>
      <Text style={s.toastLine}>Paste it anywhere to share this location</Text>
    </Animated.View>
  );
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
