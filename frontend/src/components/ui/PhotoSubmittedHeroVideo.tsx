import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Photo-submitted success checkmark animation (512×512 GIF, downscaled for display). */
const SUCCESS_GIF = require('../../../assets/animations/photo-submitted-success.gif');

type Props = {
  size?: number;
  /** @deprecated Checkmark hero no longer needs headroom; accepted for compatibility. */
  topInset?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Photo-submitted hero — animated green checkmark GIF. */
export function PhotoSubmittedHeroVideo({
  size = 140,
  topInset = 0,
  style,
  accessibilityLabel = 'Photo submitted',
}: Props) {
  const frameHeight = size + topInset;

  return (
    <View
      style={[s.frame, { width: size, height: frameHeight }, style]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Image
        source={SUCCESS_GIF}
        style={{ width: size, height: frameHeight }}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        allowDownscaling
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const s = StyleSheet.create({
  frame: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
