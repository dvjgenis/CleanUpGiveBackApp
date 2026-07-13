import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors, fontFamilies } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const needsFallback = isExpoGo || Platform.OS === 'web';

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

function EventLocationMapFallback({ address, onPress }: { address: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Open ${address} in Maps`}
      style={s.fallback}
    >
      <View style={s.pin} />
      <Text style={s.fallbackTitle}>Open in Maps</Text>
      <Text style={s.fallbackAddress} numberOfLines={2}>
        {address}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * Event location map — MapLibre pin when available; otherwise a Maps CTA card.
 * Tap opens Apple Maps (iOS) or Google Maps (Android). No static placeholder image.
 */
export function EventLocationMap({ address, coordinate, onPress }: Props) {
  if (needsFallback) {
    return <EventLocationMapFallback address={address} onPress={onPress} />;
  }

  const { EventLocationMapNative } =
    require('./EventLocationMapNative') as typeof import('./EventLocationMapNative');

  return (
    <EventLocationMapNative address={address} coordinate={coordinate} onPress={onPress} />
  );
}

const s = StyleSheet.create({
  fallback: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    backgroundColor: colors.chipSelectedBg,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  fallbackTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  fallbackAddress: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
});
