import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors, fontFamilies, radius, spacing } from '@/constants/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onEnableFlash: () => void;
  onDismiss: () => void;
};

/**
 * Shown once per capture session when it's nighttime (GPS+date sunset/sunrise
 * check) and the back-camera flash is off — unclear low-light photos can
 * cause a session to be declined.
 */
export function FlashWarningModal({ onEnableFlash, onDismiss }: Props) {
  return (
    <View style={s.root}>
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <View style={s.card}>
          <View style={s.titleBlock}>
            <Text style={s.title}>Turn on your flash</Text>
            <Text style={s.subtitle}>
              It looks like it&apos;s nighttime. Turning on your flash helps us capture a clear
              photo — unclear photos can cause your session to be declined.
            </Text>
          </View>

          <View style={s.footer}>
            <AnimatedPressable
              style={s.continueBtn}
              onPress={onEnableFlash}
              accessibilityRole="button"
              accessibilityLabel="Turn on flash and continue"
            >
              <Text style={s.continueBtnText}>Turn on flash &amp; continue</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.dismissBtn}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Continue without flash"
            >
              <Text style={s.dismissText}>Continue without flash</Text>
            </AnimatedPressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    padding: 20,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textNavInactive,
  },
  footer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  dismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textNavInactive,
  },
});
