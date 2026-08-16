import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  CLEAN_UP_GIVE_BACK_LOCATION,
  DONNA_CONTACT_EMAIL,
} from '@/constants/orgLocations';
import { EyeOffIcon, EyeOpenIcon } from '@/components/onboarding/OnboardingIcons';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { SessionSetupValidationToast } from '@/components/session-setup/SessionSetupValidationToast';

import {
  ShopCartHeartIcon,
  ShopCartIcon,
  ShopCheckoutBagIcon,
  ShopCheckoutCardIcon,
  ShopCheckoutDropoffLocationIcon,
  ShopCheckoutPaymentsIcon,
  ShopCheckoutShieldIcon,
  ShopCheckoutTruckIcon,
  ShopStripeLogo,
} from '../components/ShopIcons';
import { CartBadge } from '../components/CartBadge';
import { EmptyCartToast, useCartIconPress } from '../components/EmptyCartToast';
import { useCartDonation, useCartItems } from '../cartStore';
import { markTrackerPaid } from '@/features/session-tracking/trackerPaymentStore';
import { formatUsd, getCheckoutSummary, getTrackerCheckoutSummary } from '../mocks/checkout';
import { layout, colors, fontFamilies, radius, shadows } from '../tokens';
import {
  createShopOrder,
  type FulfillmentMethod,
} from '@/lib/shopOrders';
import { sendOrderPlacedEmail } from '@/lib/emailsApi';
import {
  lookupZipsForCityState,
  searchAddressSuggestions,
  searchCitySuggestions,
  US_STATE_CODES,
  type AddressSuggestion,
  type CitySuggestion,
} from '@/lib/geocodeAddress';
import { clearCart } from '../cartStore';
import type { CartLineItem } from '../mocks/cart';
import { openLocationInMaps } from '../utils/openLocationInMaps';
import {
  buildDropoffAddressQuery,
  formatMilesFromOffice,
  isDropoffTooFar,
  resolveDropoffDistanceMiles,
  uniqueStrings,
  uniqueSuggestionValues,
  type DropoffAddressFields,
} from '../utils/dropoffOfficeDistance';

const FULFILLMENT_OPTIONS: { value: FulfillmentMethod; label: string; hint: string }[] = [
  { value: 'usps_ship', label: 'Ship via USPS', hint: 'Donna mails it with a USPS label.' },
  { value: 'office_pickup', label: 'Pick up at the office', hint: 'Donna will coordinate pickup at the office.' },
  { value: 'local_dropoff', label: 'Local drop-off', hint: 'Donna may deliver locally when practical.' },
];

const TRACKER_ACCESS_ITEM: CartLineItem = {
  id: 'tracker-access',
  name: 'Tracking access (one-time)',
  description: 'Unlimited tracking',
  unitPrice: 49.99,
  quantity: 1,
  image: 0,
};

const FOOTER_PAD = 20;

type ShippingForm = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

type DropoffForm = DropoffAddressFields;

type DropoffDistanceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; miles: number }
  | { status: 'error' };

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
  isTrackerMode,
}: {
  cartCount: number;
  onBack: () => void;
  onCartPress: () => void;
  isTrackerMode: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
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
          <Text style={s.topBarTitle}>{isTrackerMode ? 'Payment' : 'Checkout'}</Text>
        </View>

        {isTrackerMode ? (
          <View style={s.topBarIconBtnRight} />
        ) : (
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
        )}
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

const FormField = React.forwardRef<TextInput, {
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
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  blurOnSubmit?: boolean;
  editable?: boolean;
}>(function FormField(
  {
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
    returnKeyType = 'next',
    onSubmitEditing,
    onFocus,
    onBlur,
    blurOnSubmit = false,
    editable = true,
  },
  ref,
) {
  return (
    <View style={[s.fieldWrap, hasError ? s.fieldWrapError : null, !editable ? s.fieldWrapDisabled : null, style]}>
      <TextInput
        ref={ref}
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
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        blurOnSubmit={blurOnSubmit}
        editable={editable}
        style={[s.fieldInput, trailing ? s.fieldInputWithIcon : null]}
      />
      {trailing ? <View style={s.fieldTrailing}>{trailing}</View> : null}
    </View>
  );
});

function SuggestionMenu({
  visible,
  options,
  loading,
  loadingLabel = 'Looking up addresses…',
  emptyLabel,
  onSelect,
}: {
  visible: boolean;
  options: string[];
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  onSelect: (value: string) => void;
}) {
  if (!visible) return null;
  if (loading) {
    return (
      <View style={s.suggestMenu}>
        <Text style={s.suggestHint}>{loadingLabel}</Text>
      </View>
    );
  }
  if (options.length === 0) {
    if (!emptyLabel) return null;
    return (
      <View style={s.suggestMenu}>
        <Text style={s.suggestHint}>{emptyLabel}</Text>
      </View>
    );
  }
  return (
    <View style={s.suggestMenu}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          accessibilityRole="button"
          accessibilityLabel={option}
          style={s.suggestRow}
        >
          <Text style={s.suggestRowText}>{option}</Text>
        </Pressable>
      ))}
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
  const { mode, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const isTrackerMode = mode === 'tracker';
  const items = useCartItems();
  const donation = useCartDonation();
  const summary = isTrackerMode ? getTrackerCheckoutSummary() : getCheckoutSummary(items, donation);
  const { onCartPress, toastVisible, toastKey } = useCartIconPress();
  const footerBottom = Math.max(insets.bottom, 12);
  /** iOS: pad the sticky footer so its white surface fills to the screen bottom above the keyboard. */
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // Android typically resizes the window; only extend footer padding on iOS.
  const footerPaddingBottom =
    Platform.OS === 'ios' && keyboardHeight > 0
      ? keyboardHeight + 12
      : footerBottom + FOOTER_PAD - 8;

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [dropoff, setDropoff] = useState<DropoffForm>({
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [dropoffDistance, setDropoffDistance] = useState<DropoffDistanceState>({ status: 'idle' });
  const [streetSuggestions, setStreetSuggestions] = useState<AddressSuggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [zipChoices, setZipChoices] = useState<string[]>([]);
  const [streetSuggestOpen, setStreetSuggestOpen] = useState(false);
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);
  const [stateSuggestOpen, setStateSuggestOpen] = useState(false);
  const [zipSuggestOpen, setZipSuggestOpen] = useState(false);
  const [streetSuggestLoading, setStreetSuggestLoading] = useState(false);
  const [citySuggestLoading, setCitySuggestLoading] = useState(false);
  const [zipSuggestLoading, setZipSuggestLoading] = useState(false);
  const skipStreetSearchRef = useRef(false);
  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });
  const [validationToastVisible, setValidationToastVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);
  const [showCvv, setShowCvv] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('usps_ship');
  const [kitRequested, setKitRequested] = useState(true);
  const needsShippingAddress = fulfillmentMethod === 'usps_ship';
  const needsDropoffAddress = fulfillmentMethod === 'local_dropoff';
  const cartHasKit = items.some((item) => item.id === 'cleanup-kit');
  const includesKit = isTrackerMode ? kitRequested : cartHasKit;
  const shippingLabel =
    fulfillmentMethod === 'usps_ship'
      ? summary.shippingLabel
      : fulfillmentMethod === 'office_pickup'
        ? 'Office pickup'
        : 'Local drop-off';
  const trackerLineHint = includesKit
    ? fulfillmentMethod === 'usps_ship'
      ? 'App access — kit ships via USPS'
      : fulfillmentMethod === 'office_pickup'
        ? 'App access — kit pickup at the office'
        : 'App access — kit local drop-off'
    : 'App access only — no kit';

  const streetRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const zipRef = useRef<TextInput>(null);
  const cardNumberRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const nameOnCardRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!needsDropoffAddress) {
      setDropoffDistance({ status: 'idle' });
      return;
    }

    const query = buildDropoffAddressQuery(dropoff);
    if (!query) {
      setDropoffDistance({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setDropoffDistance({ status: 'loading' });
      void resolveDropoffDistanceMiles(query, controller.signal)
        .then((miles) => {
          if (controller.signal.aborted) return;
          if (miles == null) {
            setDropoffDistance({ status: 'error' });
            return;
          }
          setDropoffDistance({ status: 'ready', miles });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setDropoffDistance({ status: 'error' });
          }
        });
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [needsDropoffAddress, dropoff.street, dropoff.city, dropoff.state, dropoff.zip]);

  useEffect(() => {
    if (!needsDropoffAddress) {
      setStreetSuggestions([]);
      setStreetSuggestOpen(false);
      return;
    }
    if (skipStreetSearchRef.current) {
      skipStreetSearchRef.current = false;
      return;
    }
    const query = dropoff.street.trim();
    if (query.length < 3) {
      setStreetSuggestions([]);
      setStreetSuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStreetSuggestLoading(true);
      void searchAddressSuggestions(query, {
        bias: {
          latitude: CLEAN_UP_GIVE_BACK_LOCATION.latitude,
          longitude: CLEAN_UP_GIVE_BACK_LOCATION.longitude,
        },
        limit: 8,
        signal: controller.signal,
      })
        .then((hits) => {
          if (controller.signal.aborted) return;
          setStreetSuggestions(hits);
          setStreetSuggestOpen(true);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setStreetSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setStreetSuggestLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [needsDropoffAddress, dropoff.street]);

  useEffect(() => {
    if (!needsDropoffAddress) {
      setCitySuggestions([]);
      return;
    }
    const query = dropoff.city.trim();
    if (query.length < 2) {
      setCitySuggestions([]);
      setCitySuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCitySuggestLoading(true);
      void searchCitySuggestions(query, {
        bias: {
          latitude: CLEAN_UP_GIVE_BACK_LOCATION.latitude,
          longitude: CLEAN_UP_GIVE_BACK_LOCATION.longitude,
        },
        limit: 8,
        signal: controller.signal,
      })
        .then((hits) => {
          if (!controller.signal.aborted) setCitySuggestions(hits);
        })
        .catch(() => {
          if (!controller.signal.aborted) setCitySuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setCitySuggestLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [needsDropoffAddress, dropoff.city]);

  useEffect(() => {
    if (!needsDropoffAddress || !dropoff.city.trim() || !dropoff.state.trim()) {
      setZipChoices([]);
      setZipSuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    setZipSuggestLoading(true);
    void lookupZipsForCityState(dropoff.city, dropoff.state, controller.signal)
      .then((zips) => {
        if (!controller.signal.aborted) setZipChoices(zips);
      })
      .catch(() => {
        if (!controller.signal.aborted) setZipChoices([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setZipSuggestLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [needsDropoffAddress, dropoff.city, dropoff.state]);

  const dropoffTooFar =
    needsDropoffAddress &&
    dropoffDistance.status === 'ready' &&
    isDropoffTooFar(dropoffDistance.miles);
  const cityHasValue = dropoff.city.trim().length > 0;
  const stateHasValue = dropoff.state.trim().length > 0;
  const cityHits: CitySuggestion[] = [];
  const citySeen = new Set<string>();
  for (const hit of [
    ...streetSuggestions
      .filter((item) => item.city.trim())
      .map((item) => ({ city: item.city, state: item.state })),
    ...citySuggestions,
  ]) {
    const key = `${hit.city}|${hit.state}`.toLowerCase();
    if (citySeen.has(key)) continue;
    citySeen.add(key);
    cityHits.push(hit);
  }
  const cityNeedle = dropoff.city.trim().toLowerCase();
  const cityOptions = cityHits
    .filter((hit) => !cityNeedle || hit.city.toLowerCase().includes(cityNeedle))
    .map((hit) => (hit.state ? `${hit.city}, ${hit.state}` : hit.city));
  const stateOptions = cityHasValue
    ? uniqueStrings([
        ...uniqueSuggestionValues(
          streetSuggestions.filter(
            (hit) => hit.city.toLowerCase() === dropoff.city.trim().toLowerCase(),
          ),
          'state',
        ),
        ...citySuggestions
          .filter((hit) => hit.city.toLowerCase() === dropoff.city.trim().toLowerCase())
          .map((hit) => hit.state),
        ...US_STATE_CODES,
      ], true)
    : [];
  const zipOptions = uniqueStrings([
    ...zipChoices,
    ...uniqueSuggestionValues(
      streetSuggestions.filter(
        (hit) =>
          hit.city.toLowerCase() === dropoff.city.trim().toLowerCase() &&
          hit.state.toLowerCase() === dropoff.state.trim().toLowerCase(),
      ),
      'zip',
    ),
  ]);

  function applyDropoffChange(next: DropoffForm) {
    setDropoff(next);
    requestAnimationFrame(() => refreshValidationFeedback(shipping, next, payment));
  }

  function applyStreetSuggestion(hit: AddressSuggestion) {
    skipStreetSearchRef.current = true;
    applyDropoffChange({
      street: hit.street || dropoff.street,
      city: hit.city,
      state: hit.state,
      zip: hit.zip,
    });
    setStreetSuggestOpen(false);
    setCitySuggestOpen(!hit.city);
    setStateSuggestOpen(Boolean(hit.city) && !hit.state);
    setZipSuggestOpen(Boolean(hit.city && hit.state) && !hit.zip);
  }

  function applyCitySuggestion(label: string) {
    const hit = cityHits.find((item) =>
      (item.state ? `${item.city}, ${item.state}` : item.city) === label,
    );
    applyDropoffChange({
      ...dropoff,
      city: hit?.city ?? label,
      state: '',
      zip: '',
    });
    setCitySuggestOpen(false);
    setStateSuggestOpen(true);
    setZipSuggestOpen(false);
  }

  function applyStateSuggestion(state: string) {
    if (!dropoff.city.trim()) return;
    applyDropoffChange({
      ...dropoff,
      state,
      zip: '',
    });
    setStateSuggestOpen(false);
    setZipSuggestOpen(true);
  }

  function applyZipSuggestion(zip: string) {
    if (!dropoff.city.trim() || !dropoff.state.trim()) return;
    applyDropoffChange({
      ...dropoff,
      zip,
    });
    setZipSuggestOpen(false);
  }

  function collectValidation(
    nextShipping = shipping,
    nextDropoff = dropoff,
    nextPayment = payment,
    method = fulfillmentMethod,
  ): { missing: string[]; errors: FieldErrors } {
    const missing: string[] = [];
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (method === 'usps_ship') {
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
    }

    if (method === 'local_dropoff') {
      if (!nextDropoff.street.trim()) {
        missing.push('Street Address');
        errors.street = true;
      }
      if (!nextDropoff.city.trim()) {
        missing.push('City');
        errors.city = true;
      }
      if (!nextDropoff.state.trim()) {
        missing.push('State');
        errors.state = true;
      }
      if (!nextDropoff.zip.trim()) {
        missing.push('ZIP Code');
        errors.zip = true;
      }
    }
    const paymentLocked =
      method === 'local_dropoff' &&
      dropoffDistance.status === 'ready' &&
      isDropoffTooFar(dropoffDistance.miles);
    if (!paymentLocked) {
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
    }

    return { missing, errors };
  }

  function applyValidation(
    nextShipping = shipping,
    nextDropoff = dropoff,
    nextPayment = payment,
    method = fulfillmentMethod,
  ): boolean {
    const { missing, errors } = collectValidation(nextShipping, nextDropoff, nextPayment, method);
    setFieldErrors(errors);
    setMissingFields(missing);
    setValidationToastVisible(missing.length > 0);
    return missing.length === 0;
  }

  function refreshValidationFeedback(
    nextShipping = shipping,
    nextDropoff = dropoff,
    nextPayment = payment,
    method = fulfillmentMethod,
  ) {
    if (!validationToastVisible) return;
    applyValidation(nextShipping, nextDropoff, nextPayment, method);
  }

  async function handlePlaceOrder() {
    const isValid = applyValidation();
    if (!isValid) return;
    if (
      fulfillmentMethod === 'local_dropoff' &&
      (dropoffDistance.status !== 'ready' || isDropoffTooFar(dropoffDistance.miles))
    ) {
      return;
    }
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setValidationToastVisible(false);

    const shippingPayload =
      fulfillmentMethod === 'usps_ship'
        ? {
            fullName: shipping.fullName,
            street: shipping.street,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
          }
        : fulfillmentMethod === 'local_dropoff'
          ? {
              fullName: '',
              street: dropoff.street,
              city: dropoff.city,
              state: dropoff.state,
              zip: dropoff.zip,
            }
          : null;

    try {
      const orderItems = isTrackerMode
        ? [{
            ...TRACKER_ACCESS_ITEM,
            description: includesKit ? 'Unlimited tracking with cleanup kit' : 'Unlimited tracking',
          }]
        : items;

      const orderResult = await createShopOrder({
        items: orderItems,
        donation: isTrackerMode ? null : donation,
        shipping: shippingPayload,
        tax: isTrackerMode ? 0 : summary.tax,
        fulfillmentMethod,
        includesKit,
      });

      if (isTrackerMode) {
        markTrackerPaid();
        if (orderResult.success) {
          void sendOrderPlacedEmail({ orderId: orderResult.orderId }).catch((err) => {
            console.warn('[checkout] Order-placed email failed:', err);
          });
        }
        const confirmationHref = returnTo
          ? (`/purchase-confirmation?mode=tracker&returnTo=${returnTo}` as Href)
          : ('/purchase-confirmation?mode=tracker' as Href);
        router.replace(confirmationHref);
        return;
      }

      if (orderResult.success) {
        console.log('[checkout] Order created successfully:', orderResult.orderId);
        void sendOrderPlacedEmail({ orderId: orderResult.orderId }).catch((err) => {
          console.warn('[checkout] Order-placed email failed:', err);
        });
        clearCart();
        router.replace(`/purchase-confirmation?orderId=${orderResult.orderId}` as Href);
      } else {
        console.error('[checkout] Order creation failed:', orderResult.error);
        // For now, continue to confirmation even if DB insert failed
        // In production, you'd want better error handling here
        router.replace('/purchase-confirmation' as Href);
      }
    } catch (error) {
      console.error('[checkout] Unexpected error during order creation:', error);
      // Continue to confirmation as fallback
      router.replace('/purchase-confirmation' as Href);
    }
  }

  return (
    <View style={s.root}>
      <CheckoutTopBar
        cartCount={summary.itemCount}
        onBack={() => router.back()}
        onCartPress={onCartPress}
        isTrackerMode={isTrackerMode}
      />
      {!isTrackerMode ? <EmptyCartToast key={toastKey} visible={toastVisible} /> : null}
      <SessionSetupValidationToast visible={validationToastVisible} missingLabels={missingFields} />

      <View style={s.body}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            citySuggestOpen || stateSuggestOpen || zipSuggestOpen ? s.scrollContentWithSuggest : null,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode="interactive"
        >
          {/* Order Summary */}
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutBagIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Order Summary</Text>
            </View>

            {summary.lines.map((line) => (
              <View key={line.id} style={s.lineRow}>
                <View style={s.lineCopy}>
                  <Text style={s.lineName}>{line.name}</Text>
                  {isTrackerMode ? (
                    <Text style={s.lineQty}>{trackerLineHint}</Text>
                  ) : (
                    <Text style={s.lineQty}>{`Qty: ${line.quantity}`}</Text>
                  )}
                </View>
                <Text style={s.linePrice}>{formatUsd(line.lineTotal)}</Text>
              </View>
            ))}

            <View style={s.divider} />

            <View style={s.charges}>
            {!isTrackerMode && summary.donation > 0 ? (
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
                <Text style={s.mutedLabel}>{shippingLabel}</Text>
              </View>
              {!isTrackerMode ? (
                <View style={s.summaryRow}>
                  <Text style={s.mutedLabel}>Taxes</Text>
                  <Text style={s.mutedLabel}>{formatUsd(summary.tax)}</Text>
                </View>
              ) : null}
            </View>

            <View style={s.divider} />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatUsd(summary.total)}</Text>
            </View>
          </View>

          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutTruckIcon width={18} height={18} />
              <Text style={s.sectionTitle}>How you&apos;ll receive it</Text>
            </View>
            <View style={s.optionStack}>
              {FULFILLMENT_OPTIONS.map((option) => {
                const selected = fulfillmentMethod === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setFulfillmentMethod(option.value);
                      requestAnimationFrame(() =>
                        refreshValidationFeedback(shipping, dropoff, payment, option.value),
                      );
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={[s.optionRow, selected ? s.optionRowSelected : null]}
                  >
                    <View style={[s.radioOuter, selected ? s.radioOuterSelected : null]}>
                      {selected ? <View style={s.radioInner} /> : null}
                    </View>
                    <View style={s.optionCopy}>
                      <Text style={s.optionLabel}>{option.label}</Text>
                      <Text style={s.optionHint}>{option.hint}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {fulfillmentMethod === 'office_pickup' ? (
              <AnimatedPressable
                scaleTo={0.98}
                onPress={() => {
                  void openLocationInMaps(CLEAN_UP_GIVE_BACK_LOCATION.fullAddress);
                }}
                accessibilityRole="link"
                accessibilityLabel={`Open ${CLEAN_UP_GIVE_BACK_LOCATION.name} in Maps`}
                accessibilityHint="Opens Apple Maps or Google Maps"
                style={s.officeAddressBlock}
              >
                <Text style={s.officeAddressName}>{CLEAN_UP_GIVE_BACK_LOCATION.name}</Text>
                <Text style={s.officeAddressLine}>{CLEAN_UP_GIVE_BACK_LOCATION.street}</Text>
                <Text style={s.officeAddressLine}>{CLEAN_UP_GIVE_BACK_LOCATION.cityStateZip}</Text>
                <Text style={s.officeAddressHint}>Tap to open in Maps</Text>
              </AnimatedPressable>
            ) : null}
            {isTrackerMode ? (
              <Pressable
                onPress={() => setKitRequested((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: kitRequested }}
                accessibilityLabel="Include a cleanup kit"
                style={s.kitToggleRow}
              >
                <View style={[s.checkbox, kitRequested ? s.checkboxChecked : null]}>
                  {kitRequested ? <Text style={s.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={s.kitToggleLabel}>Include a cleanup kit (optional)</Text>
              </Pressable>
            ) : null}
          </View>

          {needsShippingAddress ? (
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
                    requestAnimationFrame(() => refreshValidationFeedback(next, dropoff, payment));
                  }}
                  accessibilityLabel="Full name"
                  autoCapitalize="words"
                  hasError={fieldErrors.fullName}
                  returnKeyType="next"
                  onSubmitEditing={() => streetRef.current?.focus()}
                />
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="Street Address" muted hasError={fieldErrors.street} />
                <FormField
                  ref={streetRef}
                  value={shipping.street}
                  onChangeText={(street) => {
                    const next = { ...shipping, street };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, dropoff, payment));
                  }}
                  accessibilityLabel="Street address"
                  hasError={fieldErrors.street}
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                />
              </View>
              <View style={s.halfRow}>
                <View style={s.halfField}>
                  <FieldLabel label="City" muted hasError={fieldErrors.city} />
                  <FormField
                    ref={cityRef}
                    value={shipping.city}
                    onChangeText={(city) => {
                      const next = { ...shipping, city };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, dropoff, payment));
                    }}
                    accessibilityLabel="City"
                    hasError={fieldErrors.city}
                    returnKeyType="next"
                    onSubmitEditing={() => stateRef.current?.focus()}
                  />
                </View>
                <View style={s.halfField}>
                  <FieldLabel label="State" muted hasError={fieldErrors.state} />
                  <FormField
                    ref={stateRef}
                    value={shipping.state}
                    onChangeText={(state) => {
                      const next = { ...shipping, state };
                      setShipping(next);
                      requestAnimationFrame(() => refreshValidationFeedback(next, dropoff, payment));
                    }}
                    accessibilityLabel="State"
                    maxLength={2}
                    autoCapitalize="characters"
                    hasError={fieldErrors.state}
                    returnKeyType="next"
                    onSubmitEditing={() => zipRef.current?.focus()}
                  />
                </View>
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="ZIP Code" muted hasError={fieldErrors.zip} />
                <FormField
                  ref={zipRef}
                  value={shipping.zip}
                  onChangeText={(zip) => {
                    const next = {
                      ...shipping,
                      zip: zip.replace(/\D/g, '').slice(0, 10),
                    };
                    setShipping(next);
                    requestAnimationFrame(() => refreshValidationFeedback(next, dropoff, payment));
                  }}
                  accessibilityLabel="ZIP code"
                  keyboardType="number-pad"
                  maxLength={10}
                  hasError={fieldErrors.zip}
                  returnKeyType="next"
                  onSubmitEditing={() => cardNumberRef.current?.focus()}
                />
              </View>
            </View>
          </View>
          ) : null}

          {needsDropoffAddress ? (
            <View style={s.card}>
              <View style={s.sectionTitleRow}>
                <ShopCheckoutDropoffLocationIcon width={18} height={18} />
                <Text style={s.sectionTitle}>Drop-off location</Text>
              </View>
              <Text style={s.dropoffIntro}>
                Where should Donna drop off your order? Enter an address within her local route of
                Clean Up Give Back. Choose city, then state, then ZIP.
              </Text>

              <View style={s.formStack}>
                <View style={s.fieldBlock}>
                  <FieldLabel label="Street Address" muted hasError={fieldErrors.street} />
                  <FormField
                    ref={streetRef}
                    value={dropoff.street}
                    onChangeText={(street) => {
                      applyDropoffChange({ ...dropoff, street });
                      setStreetSuggestOpen(true);
                    }}
                    accessibilityLabel="Drop-off street address"
                    hasError={fieldErrors.street}
                    returnKeyType="next"
                    onFocus={() => {
                      if (streetSuggestions.length > 0 || streetSuggestLoading) {
                        setStreetSuggestOpen(true);
                      }
                    }}
                    onSubmitEditing={() => cityRef.current?.focus()}
                  />
                  <SuggestionMenu
                    visible={streetSuggestOpen && (streetSuggestLoading || dropoff.street.trim().length >= 3)}
                    loading={streetSuggestLoading}
                    options={streetSuggestions.map((hit) => hit.label)}
                    emptyLabel="No matching addresses. Choose a city next, then state, then ZIP."
                    onSelect={(label) => {
                      const hit = streetSuggestions.find((item) => item.label === label);
                      if (hit) applyStreetSuggestion(hit);
                    }}
                  />
                </View>
                <View style={s.fieldBlock}>
                  <FieldLabel label="City" muted hasError={fieldErrors.city} />
                  <FormField
                    ref={cityRef}
                    value={dropoff.city}
                    onChangeText={(city) => {
                      applyDropoffChange({
                        ...dropoff,
                        city,
                        state: '',
                        zip: '',
                      });
                      setCitySuggestOpen(true);
                      setStateSuggestOpen(false);
                      setZipSuggestOpen(false);
                    }}
                    placeholder="Start typing a city"
                    accessibilityLabel="Drop-off city"
                    autoCapitalize="words"
                    hasError={fieldErrors.city}
                    returnKeyType="next"
                    onFocus={() => setCitySuggestOpen(true)}
                    onSubmitEditing={() => {
                      if (cityHasValue) stateRef.current?.focus();
                    }}
                  />
                  <SuggestionMenu
                    visible={citySuggestOpen}
                    loading={citySuggestLoading && cityOptions.length === 0}
                    loadingLabel="Looking up cities…"
                    options={cityOptions}
                    emptyLabel="Keep typing a city name to see matches."
                    onSelect={applyCitySuggestion}
                  />
                </View>
                <View style={s.fieldBlock}>
                  <FieldLabel label="State" muted hasError={fieldErrors.state} />
                  <FormField
                    ref={stateRef}
                    value={dropoff.state}
                    onChangeText={(state) => {
                      if (!cityHasValue) return;
                      applyDropoffChange({
                        ...dropoff,
                        state,
                        zip: '',
                      });
                      setStateSuggestOpen(true);
                      setZipSuggestOpen(false);
                    }}
                    placeholder={cityHasValue ? 'Select a state' : 'City first'}
                    accessibilityLabel="Drop-off state"
                    maxLength={2}
                    autoCapitalize="characters"
                    hasError={fieldErrors.state}
                    editable={cityHasValue}
                    returnKeyType="next"
                    onFocus={() => {
                      if (cityHasValue) setStateSuggestOpen(true);
                    }}
                    onSubmitEditing={() => {
                      if (stateHasValue) zipRef.current?.focus();
                    }}
                  />
                  <SuggestionMenu
                    visible={stateSuggestOpen && cityHasValue}
                    options={stateOptions.filter((state) =>
                      dropoff.state.trim()
                        ? state.toLowerCase().startsWith(dropoff.state.trim().toLowerCase())
                        : true,
                    )}
                    emptyLabel="Select a city first."
                    onSelect={applyStateSuggestion}
                  />
                </View>
                <View style={s.fieldBlock}>
                  <FieldLabel label="ZIP Code" muted hasError={fieldErrors.zip} />
                  <FormField
                    ref={zipRef}
                    value={dropoff.zip}
                    onChangeText={(zip) => {
                      if (!cityHasValue || !stateHasValue) return;
                      applyDropoffChange({
                        ...dropoff,
                        zip: zip.replace(/\D/g, '').slice(0, 10),
                      });
                      setZipSuggestOpen(true);
                    }}
                    placeholder={
                      cityHasValue && stateHasValue ? 'Select a ZIP' : 'City and state first'
                    }
                    accessibilityLabel="Drop-off ZIP code"
                    keyboardType="number-pad"
                    maxLength={10}
                    hasError={fieldErrors.zip}
                    editable={cityHasValue && stateHasValue}
                    returnKeyType="next"
                    onFocus={() => {
                      if (cityHasValue && stateHasValue) setZipSuggestOpen(true);
                    }}
                    onSubmitEditing={() => cardNumberRef.current?.focus()}
                  />
                  <SuggestionMenu
                    visible={zipSuggestOpen && cityHasValue && stateHasValue}
                    loading={zipSuggestLoading && zipOptions.length === 0}
                    loadingLabel="Looking up ZIP codes…"
                    options={zipOptions.filter((zip) =>
                      dropoff.zip.trim() ? zip.startsWith(dropoff.zip.trim()) : true,
                    )}
                    emptyLabel="No ZIP codes found for that city and state."
                    onSelect={applyZipSuggestion}
                  />
                </View>
              </View>

              {dropoffDistance.status === 'loading' ? (
                <Text style={s.dropoffDistanceText}>Calculating distance from Clean Up Give Back…</Text>
              ) : dropoffDistance.status === 'ready' && isDropoffTooFar(dropoffDistance.miles) ? (
                <View style={s.dropoffTooFarBox} accessibilityRole="alert">
                  <Text style={s.dropoffTooFarText}>
                    {formatMilesFromOffice(dropoffDistance.miles)}. This is too far from the office.
                    Please ship via USPS or contact Donna at{' '}
                    <Text
                      style={s.dropoffEmailLink}
                      onPress={() => {
                        void Linking.openURL(`mailto:${DONNA_CONTACT_EMAIL}`);
                      }}
                      accessibilityRole="link"
                    >
                      {DONNA_CONTACT_EMAIL}
                    </Text>
                    .
                  </Text>
                </View>
              ) : dropoffDistance.status === 'ready' ? (
                <View style={s.dropoffDistanceRow} accessibilityRole="text">
                  <Text style={s.dropoffDistanceValue}>
                    {formatMilesFromOffice(dropoffDistance.miles)}
                  </Text>
                  <Text style={s.dropoffDistanceHint}>
                    From {CLEAN_UP_GIVE_BACK_LOCATION.name} · {CLEAN_UP_GIVE_BACK_LOCATION.street},{' '}
                    {CLEAN_UP_GIVE_BACK_LOCATION.cityStateZip}
                  </Text>
                  <Text style={s.dropoffInRangeCopy}>
                    This address is close enough for a local drop-off. After you place the order,
                    Donna will contact you to arrange a time.
                  </Text>
                </View>
              ) : dropoffDistance.status === 'error' ? (
                <Text style={s.dropoffDistanceError}>
                  We couldn&apos;t verify this address. Check the fields and try again.
                </Text>
              ) : null}
            </View>
          ) : null}

          {fulfillmentMethod === 'office_pickup' ? (
            <View style={s.card}>
              <Text style={s.pickupCopy}>
                No mailing address needed. Donna will coordinate your pickup time.
              </Text>
            </View>
          ) : null}

          {/* Payment */}
          {dropoffTooFar ? (
            <View style={s.card} accessibilityRole="text">
              <View style={s.sectionTitleRow}>
                <ShopCheckoutPaymentsIcon width={18} height={18} />
                <Text style={s.sectionTitle}>Payment</Text>
              </View>
              <Text style={s.pickupCopy}>
                Switch to Ship via USPS to enter your card details.
              </Text>
            </View>
          ) : (
          <View style={s.card}>
            <View style={s.sectionTitleRow}>
              <ShopCheckoutPaymentsIcon width={18} height={18} />
              <Text style={s.sectionTitle}>Payment</Text>
            </View>

            <View style={s.formStack}>
              <View style={s.fieldBlock}>
                <FieldLabel label="Card Number" hasError={fieldErrors.cardNumber} />
                <FormField
                  ref={cardNumberRef}
                  value={payment.cardNumber}
                  onChangeText={(text) => {
                    const next = { ...payment, cardNumber: formatCardNumber(text) };
                    setPayment(next);
                    requestAnimationFrame(() => refreshValidationFeedback(shipping, dropoff, next));
                  }}
                  placeholder="1234 5678 9012 3456"
                  accessibilityLabel="Card number"
                  keyboardType="number-pad"
                  maxLength={19}
                  trailing={<ShopCheckoutCardIcon width={24} height={24} />}
                  hasError={fieldErrors.cardNumber}
                  returnKeyType="next"
                  onSubmitEditing={() => expiryRef.current?.focus()}
                />
              </View>
              <View style={s.halfRow}>
                <View style={s.halfField}>
                  <FieldLabel label="Expiry" hasError={fieldErrors.expiry} />
                  <FormField
                    ref={expiryRef}
                    value={payment.expiry}
                    onChangeText={(text) => {
                      const next = { ...payment, expiry: formatExpiry(text) };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, dropoff, next));
                    }}
                    placeholder="MM / YY"
                    accessibilityLabel="Expiry date"
                    keyboardType="number-pad"
                    maxLength={7}
                    textAlign="center"
                    hasError={fieldErrors.expiry}
                    returnKeyType="next"
                    onSubmitEditing={() => cvvRef.current?.focus()}
                  />
                </View>
                <View style={s.halfField}>
                  <FieldLabel label="CVV" hasError={fieldErrors.cvv} />
                  <FormField
                    ref={cvvRef}
                    value={payment.cvv}
                    onChangeText={(cvv) => {
                      const next = {
                        ...payment,
                        cvv: cvv.replace(/\D/g, '').slice(0, 3),
                      };
                      setPayment(next);
                      requestAnimationFrame(() => refreshValidationFeedback(shipping, dropoff, next));
                    }}
                    placeholder="•••"
                    accessibilityLabel="CVV"
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry={!showCvv}
                    textAlign="center"
                    hasError={fieldErrors.cvv}
                    returnKeyType="next"
                    onSubmitEditing={() => nameOnCardRef.current?.focus()}
                    trailing={
                      <Pressable
                        onPress={() => setShowCvv((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={showCvv ? 'Hide CVV' : 'Show CVV'}
                        hitSlop={8}
                      >
                        {showCvv
                          ? <EyeOpenIcon size={20} color={colors.textNavInactive} />
                          : <EyeOffIcon size={20} color={colors.textNavInactive} />
                        }
                      </Pressable>
                    }
                  />
                </View>
              </View>
              <View style={s.fieldBlock}>
                <FieldLabel label="Name on Card" hasError={fieldErrors.nameOnCard} />
                <FormField
                  ref={nameOnCardRef}
                  value={payment.nameOnCard}
                  onChangeText={(nameOnCard) => {
                    const next = { ...payment, nameOnCard };
                    setPayment(next);
                    requestAnimationFrame(() => refreshValidationFeedback(shipping, dropoff, next));
                  }}
                  accessibilityLabel="Name on card"
                  autoCapitalize="words"
                  hasError={fieldErrors.nameOnCard}
                  returnKeyType="done"
                  onSubmitEditing={handlePlaceOrder}
                  blurOnSubmit
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
          )}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: footerPaddingBottom }]}>
          <AnimatedPressable
            scaleTo={0.98}
            style={[s.placeOrderBtn, dropoffTooFar ? s.placeOrderBtnDisabled : null]}
            onPress={handlePlaceOrder}
            accessibilityRole="button"
            accessibilityLabel="Place order"
            accessibilityState={{ disabled: dropoffTooFar }}
          >
            <Text style={s.placeOrderText}>Place Order</Text>
          </AnimatedPressable>
          <View style={s.stripeRow}>
            <Text style={s.poweredBy}>powered by </Text>
            <ShopStripeLogo width={24} height={24} />
          </View>
        </View>
      </View>
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
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    justifyContent: 'center',
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
  scrollContentWithSuggest: {
    paddingBottom: 220,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 20,
    gap: 16,
    overflow: 'visible',
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
  optionStack: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textNavInactive,
  },
  kitToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamilies.notoSansBold,
    lineHeight: 14,
  },
  kitToggleLabel: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropoffIntro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
    marginBottom: 12,
  },
  dropoffDistanceRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    gap: 4,
  },
  dropoffDistanceValue: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  dropoffDistanceHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
  },
  dropoffInRangeCopy: {
    marginTop: 8,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  dropoffDistanceText: {
    marginTop: 12,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textNavInactive,
  },
  dropoffDistanceError: {
    marginTop: 12,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.statusDeclinedText,
  },
  dropoffTooFarBox: {
    marginTop: 12,
  },
  dropoffTooFarText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.statusDeclinedText,
  },
  dropoffEmailLink: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  placeOrderBtnDisabled: {
    opacity: 0.45,
  },
  pickupCopy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  officeAddressBlock: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    gap: 2,
  },
  officeAddressName: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  officeAddressLine: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  officeAddressHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    marginTop: 4,
  },
  formStack: {
    gap: 15,
    width: '100%',
  },
  fieldBlock: {
    gap: 6,
    width: '100%',
    zIndex: 2,
  },
  suggestMenu: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    overflow: 'hidden',
    zIndex: 8,
  },
  suggestRow: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderOutline,
  },
  suggestRowText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  suggestHint: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textNavInactive,
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
  fieldWrapDisabled: {
    opacity: 0.55,
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
