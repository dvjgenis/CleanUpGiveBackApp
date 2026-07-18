import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors as C, radius } from '@/constants/tokens';

type Props = {
  continueLabel?: string;
  previousLabel?: string;
  skipLabel?: string;
  onContinuePress: () => void;
  onPreviousPress?: () => void;
  onSkipPress?: () => void;
  /** Dims Continue and blocks Skip while a permission request is in flight. */
  disabled?: boolean;
  /** Hides Previous (e.g. guide step 1). */
  hidePrevious?: boolean;
  /** Hides Skip (e.g. finale — Start Tracking / Previous only). */
  hideSkip?: boolean;
  skipAccessibilityLabel?: string;
};

/**
 * Shared Continue / Previous / Skip footer for session-setup guide screens.
 * Button styles match onboarding `OnboardingInfoFooterActions` / `TourNavButtons`
 * (IBM Plex SemiBold 18, paddingVertical 20, radius.md).
 */
export function SessionSetupGuideFooterActions({
  continueLabel = 'Continue',
  previousLabel = 'Previous',
  skipLabel = 'Skip',
  onContinuePress,
  onPreviousPress,
  onSkipPress,
  disabled = false,
  hidePrevious = false,
  hideSkip = false,
  skipAccessibilityLabel,
}: Props) {
  return (
    <View style={styles.footer}>
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          style={[styles.continueBtn, disabled && styles.continueBtnDisabled]}
          onPress={onContinuePress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
        >
          <Text style={styles.continueBtnText}>{continueLabel}</Text>
        </AnimatedPressable>
        {!hidePrevious && onPreviousPress && (
          <AnimatedPressable
            style={styles.previousBtn}
            onPress={onPreviousPress}
            accessibilityRole="button"
            accessibilityLabel={previousLabel}
          >
            <Text style={styles.previousBtnText}>{previousLabel}</Text>
          </AnimatedPressable>
        )}
      </View>
      {!hideSkip && onSkipPress && (
        <AnimatedPressable
          style={styles.skipBtn}
          onPress={onSkipPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={skipAccessibilityLabel ?? skipLabel}
        >
          <Text style={styles.skipBtnText}>{skipLabel}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  continueBtnDisabled: {
    opacity: 0.7,
  },
  continueBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previousBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.primary,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  skipBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontWeight: '600',
    fontSize: 16,
    color: C.primary,
  },
});
