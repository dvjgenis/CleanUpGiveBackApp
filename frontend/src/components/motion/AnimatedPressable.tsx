import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pressScale, pressSpring } from '@/motion';

type Props = PressableProps & {
  /** Press-down scale — defaults to Emil `0.97`. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable with Reanimated spring scale feedback (`@emil press=spring scale=0.97`).
 * Use on all primary touch targets in the Expo Go flow.
 */
export function AnimatedPressable({
  scaleTo = pressScale.default,
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={style}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) {
            scale.value = withSpring(scaleTo, pressSpring);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, pressSpring);
          onPressOut?.(event);
        }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
