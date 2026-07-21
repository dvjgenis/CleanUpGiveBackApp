import { StyleSheet, Text, View } from 'react-native';

import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { colors, radius, textStyles } from '@/features/session-tracking/tokens';

/** Shown during live tracking when background GPS is unavailable (Expo Go / When In Use). */
export function LiveSessionBackgroundTrackingBanner() {
  const { isActive, backgroundLocationEnabled } = useLiveSession();

  if (!isActive || backgroundLocationEnabled) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={[textStyles.bodySmall, styles.text]}>
        Route tracking pauses when you leave the app or lock your phone. Keep the app open for a
        continuous path.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
