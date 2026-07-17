import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { PlayOnceLottie } from '@/components/ui/PlayOnceLottie';
import { colors, fontFamilies, radius, spacing } from '@/constants/tokens';
import { ShopStripeLogo } from '@/features/figma-screens/components/ShopAssetIcons.generated';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onContinue: () => void;
  onPayLater: () => void;
};

/**
 * Figma `free_trial_done` (`1141:2178`) — free-trial paywall shown once the
 * one free hour of tracking has elapsed. The chat-bubble hero icon from the
 * design is intentionally omitted per product direction; an hourglass Lottie
 * plays above the title instead. Continue / Pay Later / Stripe row live
 * inside the card rather than as a separate bottom-pinned footer.
 */
export function FreeTrialModal({ onContinue, onPayLater }: Props) {
  return (
    <View style={s.root}>
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <View style={s.card}>
          <View style={s.heroBlock}>
            <PlayOnceLottie
              source={require('@/assets/animations/hourglass.json')}
              size={150}
              style={s.hourglass}
              accessibilityLabel="Hourglass"
              loop
            />

            <View style={s.titleBlock}>
              <Text style={s.title}>Your one hour is up!</Text>
              <Text style={s.subtitle}>
                Please pay a one-time fee in order to use the tracking features of this app.
              </Text>
            </View>
          </View>

          <View style={s.priceCard}>
            <View style={s.priceRow}>
              <View style={s.priceDescription}>
                <Text style={s.priceLabel}>One-time</Text>
                <Text style={s.priceSublabel}>Includes shipping and cleanup kit</Text>
              </View>
              <Text style={s.priceValue}>$49.99</Text>
            </View>
          </View>

          <View style={s.footer}>
            <AnimatedPressable
              style={s.continueBtn}
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={s.continueBtnText}>Continue</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.payLaterBtn}
              onPress={onPayLater}
              accessibilityRole="button"
              accessibilityLabel="Pay later"
            >
              <Text style={s.payLaterText}>Pay Later</Text>
            </AnimatedPressable>

            <View style={s.stripeRow}>
              <Text style={s.poweredByText}>powered by </Text>
              <ShopStripeLogo width={24} height={24} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: 13,
    paddingTop: 0,
    paddingBottom: 24,
    gap: spacing.lg,
  },
  heroBlock: {
    gap: 0,
  },
  hourglass: {
    alignSelf: 'center',
    marginTop: -20,
  },
  titleBlock: {
    gap: 6,
    marginTop: -20,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
  },
  priceCard: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceDescription: {
    flex: 1,
    gap: 5,
  },
  priceLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.primary,
  },
  priceSublabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textNavInactive,
  },
  priceValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 18,
    color: colors.primary,
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
  payLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  payLaterText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textNavInactive,
  },
  stripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  poweredByText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
