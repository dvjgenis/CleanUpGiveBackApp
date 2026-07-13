import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { SessionSetupValidationToast } from '@/components/session-setup/SessionSetupValidationToast';

import {
  ShopCartHeartIcon,
  ShopCartIcon,
  ShopCheckoutBagIcon,
  ShopCheckoutCardIcon,
  ShopCheckoutPaymentsIcon,
  ShopCheckoutShieldIcon,
  ShopCheckoutTruckIcon,
  ShopStripeLogo,
} from '../components/ShopIcons';
import { CartBadge } from '../components/CartBadge';
import { EmptyCartToast, useCartIconPress } from '../components/EmptyCartToast';
import { useCartDonation, useCartItems } from '../cartStore';
import { formatUsd, getCheckoutSummary } from '../mocks/checkout';
import { colors, fontFamilies, radius, shadows } from '../tokens';

const TOP_BAR_PADDING_BOTTOM = 8.5;
const TOP_BAR_TITLE_ROW = 44;
const FOOTER_PAD = 20;

type ShippingForm = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

type PaymentForm = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  nameOnCard: string;
};

type FieldKey =
  | 'fullName'
  | 'street'
  | 'city'
  | 'state'
  | 'zip'
  | 'cardNumber'
  | 'expiry'
  | 'cvv'
  | 'nameOnCard';

type FieldErrors = Record<FieldKey, boolean>;

const EMPTY_FIELD_ERRORS: FieldErrors = {
  fullName: false,
  street: false,
  city: false,
  state: false,
  zip: false,
  cardNumber: false,
  expiry: false,
  cvv: false,
  nameOnCard: false,
};

function CheckoutTopBar({
  cartCount,
  onBack,
  onCartPress,
}: {
  cartCount: number;
  onBack: () => void;
  onCartPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: TOP_BAR_PADDING_BOTTOM }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarIconBtnLeft}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={colors.textPrimary} />
        </AnimatedPressable>

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle}>Checkout</Text>
        </View>

        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarIconBtnRight}
          onPress={onCartPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        >
          <View style={s.cartIconWrap}>
            <ShopCartIcon width={24} height={24} />
            <CartBadge count={cartCount} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function FieldLabel({
  label,
  muted,
  hasError,
}: {
  label: string;
  muted?: boolean;
  hasError?: boolean;
}) {
  return (
    <Text
      style={[
        s.fieldLabel,
        muted ? s.fieldLabelMuted : null,
        hasError ? s.fieldLabelError : null,
      ]}
    >
      {label}
    </Text>
  );
}

function FormField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  keyboardType = 'default',
  maxLength,
  secureTextEntry,
  autoCapitalize = 'none',
  textAlign = 'left',
  style,
  trailing,
  hasError,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  textAlign?: 'left' | 'center';
  style?: object;
  trailing?: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <View style={[s.fieldWrap, hasError ? s.fieldWrapError : null, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textNavInactive}
        accessibilityLabel={accessibilityLabel}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        textAlign={textAlign}
        style={[s.fieldInput, trailing ? s.fieldInputWithIcon : null]}
      />
      {trailing ? <View style={s.fieldTrailing}>{trailing}</View> : null}
    </View>
  );
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/**
 * Checkout — Figma `shop_checkout_final` (`657:1809` / PRD §6.23).
 * Shipping + payment forms; Place Order → `/purchase-confirmation`.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const donation = useCartDonation();
  const summary = getCheckoutSummary(items, donation);
  const { onCartPress, toastVisible, toastKey } = useCartIconPress();
  const footerBottom = Math.max(insets.bottom, 12);

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });
  const [validationToastVisible, setValidationToastVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);

  function collectValidation(
    nextShipping = shipping,
    nextPayment = payment,
  ): { missing: string[]; errors: FieldErrors } {
    const missing: string[] = [];
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (!nextShipping.fullName.trim()) {
      missing.push('Full Name');
      errors.fullName = true;
    }
    if (!nextShipping.street.trim()) {
      missing.push('Street Address');
      errors.street = true;
    }
    if (!nextShipping.city.trim()) {
      missing.push('City');
      errors.city = true;
    }
    if (!nextShipping.state.trim()) {
      missing.push('State');
      errors.state = true;
    }
    if (!nextShipping.zip.trim()) {
      missing.push('ZIP Code');
      errors.zip = true;
    }
    const rawCard = nextPayment.cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) {
      missing.push('Card Number');
      errors.cardNumber = true;
    }
    const rawExpiry = nextPayment.expiry.replace(/\s/g, '').replace('/', '');
    if (rawExpiry.length < 4) {
      missing.push('Expiry');
      errors.expiry = true;
    }
    if (nextPayment.cvv.length < 3) {
      missing.push('CVV');
      errors.cvv = true;
    }
    if (!nextPayment.nameOnCard.trim()) {
      missing.push('Name on Card');
      errors.nameOnCard = true;
    }

    return { missing, errors };
  }

  function applyValidation(nextShipping = shipping, nextPayment = payment): boolean {
    const { missing, errors } = collectValidation(nextShipping, nextPayment);
    setFieldErrors(errors);
    setMissingFields(missing);
    setValidationToastVisible(missing.length > 0);
    return missing.length === 0;
  }

  function refreshValidationFeedback(
    nextShipping = shipping,
    nextPayment = payment,
  ) {
    if (!validationToastVisible) return;
    applyValidation(nextShipping, nextPayment);
  }

  function handlePlaceOrder() {
    const isValid = applyValidation();
    if (!isValid) return;
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setValidationToastVisible(false);
    router.replace('/purchase-confirmation' as Href);
  }

  return (
    <View style={s.root}>
      <CheckoutTopBar
        cartCount={summary.itemCount}
        onBack={() => router.back()}
        onCartPress={onCartPress}
      />
      <EmptyCartToast key={toastKey} visible={toastVisible} />
      <SessionSetupValidationToast visible={validationToastVisible} missingLabels={missingFields} />

      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutBagIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Order Summary</Text>
            </View>

            {summary.lines.map((line) => (
              <View key={line.name} style={s.lineRow}>
                <View style={s.lineCopy}>
                  <Text style={s.lineName}>{line.name}</Text>
                  <Text style={s.lineQty}>{`Qty: ${line.quantity}`}</Text>
                </View>
                <Text style={s.linePrice}>{formatUsd(line.lineTotal)}</Text>
              </View>
            ))}

            <View style={s.divider} />

            <View style={s.charges}>
            {summary.donation > 0 ? (
              <View style={s.summaryRow}>
                <View style={s.donationLabelRow}>
                  <Text style={s.donationLabel}>Donation</Text>
                  <ShopCartHeartIcon width={16} height={16} />
                </View>
                <Text style={s.donationValue}>{formatUsd(summary.donation)}</Text>
              </View>
            ) : null}
              <View style={s.summaryRow}>
                <Text style={s.mutedLabel}>Shipping</Text>
                <Text style={s.mutedLabel}>{summary.shippingLabel}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.mutedLabel}>Taxes</Text>
                <Text style={s.mutedLabel}>{formatUsd(summary.tax)}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatUsd(summary.total)}</Text>
            </View>
          </View>

          {/* Shipping */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutTruckIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Shipping Information</Text>
            </View>

            <View style={s.formStack}>
              <View style={s.fieldBlock}>
                <FieldLabel label="Full Name" muted hasError={fieldErrors.fullName} />
                <FormField
                  value={shipping.fullName}
                  onChangeText={(fullName) => {
                    const next = { ...shipping, fullName };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="Full name"
                  autoCapitalize="words"
                  hasError={fieldErrors.fullName}
                />
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="Street Address" muted hasError={fieldErrors.street} />
                <FormField
                  value={shipping.street}
                  onChangeText={(street) => {
                    const next = { ...shipping, street };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="Street address"
                  hasError={fieldErrors.street}
                />
              </View>
              <View style={s.halfRow}>
                <View style={s.halfField}>
                  <FieldLabel label="City" muted hasError={fieldErrors.city} />
                  <FormField
                    value={shipping.city}
                    onChangeText={(city) => {
                      const next = { ...shipping, city };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                    }}
                    accessibilityLabel="City"
                    hasError={fieldErrors.city}
                  />
                </View>
                <View style={s.halfField}>
                  <FieldLabel label="State" muted hasError={fieldErrors.state} />
                  <FormField
                    value={shipping.state}
                    onChangeText={(state) => {
                      const next = { ...shipping, state };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                    }}
                    accessibilityLabel="State"
                    maxLength={2}
                    autoCapitalize="characters"
                    hasError={fieldErrors.state}
                  />
                </View>
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="ZIP Code" muted hasError={fieldErrors.zip} />
                <FormField
                  value={shipping.zip}
                  onChangeText={(zip) => {
                    const next = {
                      ...shipping,
                      zip: zip.replace(/\D/g, '').slice(0, 10),
                    };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, payment));
                  }}
                  accessibilityLabel="ZIP code"
                  keyboardType="number-pad"
                  maxLength={10}
                  hasError={fieldErrors.zip}
                />
              </View>
            </View>
          </View>

          {/* Payment */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutPaymentsIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Payment</Text>
            </View>

            <View style={s.formStack}>
              <View style={s.fieldBlock}>
                <FieldLabel label="Card Number" hasError={fieldErrors.cardNumber} />
                <FormField
                  value={payment.cardNumber}
                  onChangeText={(text) => {
                    const next = { ...payment, cardNumber: formatCardNumber(text) };
                    setPayment(next);
                    requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                  }}
                  placeholder="1234 5678 9012 3456"
                  accessibilityLabel="Card number"
                  keyboardType="number-pad"
                  maxLength={19}
                  trailing={<ShopCheckoutCardIcon width={24} height={24} />}
                  hasError={fieldErrors.cardNumber}
                />
              </View>
              <View style={s.halfRow}>
                <View style={s.halfField}>
                  <FieldLabel label="Expiry" hasError={fieldErrors.expiry} />
                  <FormField
                    value={payment.expiry}
                    onChangeText={(text) => {
                      const next = { ...payment, expiry: formatExpiry(text) };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                    }}
                    placeholder="MM / YY"
                    accessibilityLabel="Expiry date"
                    keyboardType="number-pad"
                    maxLength={7}
                    textAlign="center"
                    hasError={fieldErrors.expiry}
                  />
                </View>
                <View style={s.halfField}>
                  <FieldLabel label="CVV" hasError={fieldErrors.cvv} />
                  <FormField
                    value={payment.cvv}
                    onChangeText={(cvv) => {
                      const next = {
                        ...payment,
                        cvv: cvv.replace(/\D/g, '').slice(0, 4),
                      };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                    }}
                    placeholder="•••"
                    accessibilityLabel="CVV"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    textAlign="center"
                    hasError={fieldErrors.cvv}
                  />
                </View>
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="Name on Card" hasError={fieldErrors.nameOnCard} />
                <FormField
                  value={payment.nameOnCard}
                  onChangeText={(nameOnCard) => {
                    const next = { ...payment, nameOnCard };
                    setPayment(next);
                    requestAnimationFrame(() => refreshValidationFeedback(shipping, next));
                  }}
                  accessibilityLabel="Name on card"
                  autoCapitalize="words"
                  hasError={fieldErrors.nameOnCard}
                />
              </View>
              <View style={s.secureRow}>
                <ShopCheckoutShieldIcon width={18} height={18} />
                <Text style={s.secureText}>
                  Your payment info is encrypted and never stored on our servers.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: footerBottom + FOOTER_PAD - 8 }]}>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.placeOrderBtn}
            onPress={handlePlaceOrder}
            accessibilityRole="button"
            accessibilityLabel="Place order"
          >
            <Text style={s.placeOrderText}>Place Order</Text>
          </AnimatedPressable>
          <View style={s.stripeRow}>
            <Text style={s.poweredBy}>powered by </Text>
            <ShopStripeLogo width={24} height={24} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  body: {
    flex: 1,
  },
  topBar: {
    backgroundColor: colors.white,
    zIndex: 2,
  },
  topBarRow: {
    height: TOP_BAR_TITLE_ROW,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  topBarIconBtnLeft: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarIconBtnRight: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  topBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  cartIconWrap: {
    width: 24,
    height: 24,
    overflow: 'visible',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 30,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 20,
    gap: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lineCopy: {
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  lineName: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  lineQty: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  linePrice: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 20,
    lineHeight: 32,
    color: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
    alignSelf: 'stretch',
  },
  charges: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donationLabel: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  donationValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  mutedLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  formStack: {
    gap: 15,
    width: '100%',
  },
  fieldBlock: {
    gap: 6,
    width: '100%',
  },
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfField: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  fieldLabelMuted: {
    color: colors.textNavInactive,
  },
  fieldLabelError: {
    color: colors.statusDeclinedText,
  },
  fieldWrap: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
  },
  fieldWrapError: {
    borderColor: colors.statusDeclinedBorder,
  },
  fieldInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 15,
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  fieldInputWithIcon: {
    paddingRight: 44,
  },
  fieldTrailing: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  secureText: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderOutline,
    paddingHorizontal: 16,
    paddingTop: FOOTER_PAD,
    gap: 8,
    alignItems: 'stretch',
  },
  placeOrderBtn: {
    alignSelf: 'stretch',
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  stripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  poweredBy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
