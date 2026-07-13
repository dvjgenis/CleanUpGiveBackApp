import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies } from '../tokens';

const BADGE_SIZE = 16;

type CartBadgeProps = {
  count: number;
};

/**
 * Green cart count pill — number is optically centered in the badge.
 * Hidden when count is 0.
 */
export function CartBadge({ count }: CartBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View style={[s.badge, count > 9 ? s.badgeWide : null]} pointerEvents="none">
      <Text style={s.text} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWide: {
    paddingHorizontal: 4,
  },
  text: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textOnPrimary,
    textAlign: 'center',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center' as const,
      },
      default: {},
    }),
  },
});
