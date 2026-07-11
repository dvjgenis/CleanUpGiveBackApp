import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

const C = {
  primary: '#009540',
  textOnPrimary: '#ffffff',
} as const;

type Props = {
  continueLabel?: string;
  skipLabel?: string;
  onContinuePress: () => void;
  onSkipPress: () => void;
  skipAccessibilityLabel?: string;
};

/** Guide step 1 footer — matches Continue / Skip styles on steps 2–5. */
export function SessionSetupGuideFooterActions({
  continueLabel = 'Continue',
  skipLabel = 'Skip',
  onContinuePress,
  onSkipPress,
  skipAccessibilityLabel = 'Skip guide',
}: Props) {
  return (
    <View style={styles.footer}>
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          style={styles.continueBtn}
          onPress={onContinuePress}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
        >
          <Text style={styles.continueBtnText}>{continueLabel}</Text>
        </AnimatedPressable>
      </View>
      <AnimatedPressable
        onPress={onSkipPress}
        accessibilityRole="button"
        accessibilityLabel={skipAccessibilityLabel}
      >
        <Text style={styles.skipText}>{skipLabel}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 30,
    alignItems: 'center',
  },
  buttonContainer: {
    alignSelf: 'stretch',
    gap: 20,
  },
  continueBtn: {
    height: 56,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
  skipText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },
});
