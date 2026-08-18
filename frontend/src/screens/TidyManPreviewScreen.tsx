import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BroomSweepLoader } from '@/components/ui/BroomSweepLoader';
import { colors, fontFamilies, textStyles } from '@/constants/tokens';

/** Dev preview for the broom-sweep loader — open `/tidy-man-preview`. */
export function TidyManPreviewScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  return (
    <View style={s.root}>
      <BroomSweepLoader width={width} height={height} />
      <Text style={s.label} accessibilityRole="text">
        Loading sessions
      </Text>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={s.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={s.backLabel}>Back</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  label: {
    ...textStyles.headlinePage,
    position: 'absolute',
    top: '58%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textOnPrimarySoft,
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 20,
  },
  backLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textTertiary,
  },
});
