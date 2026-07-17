import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { OnboardingInfoFooterActions } from '@/components/onboarding/OnboardingInfoFooterActions';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { colors as C } from '@/features/figma-screens/tokens';
import { durations, easing, modalSpring } from '@/motion';
import {
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';


/** Extra travel so the sheet starts fully off-screen below the fold. */
const SHEET_BOTTOM_BLEED = 48;

function validatePhone(digits: string, country: Country) {
  if (!digits) return 'Phone number is required';
  const minDigits = country.iso2 === 'US' || country.iso2 === 'CA' ? 10 : 4;
  if (digits.length < minDigits) {
    return country.iso2 === 'US' || country.iso2 === 'CA'
      ? 'Enter a valid 10-digit number'
      : 'Enter a valid phone number';
  }
  return undefined;
}

function ChevronDown({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.964 15.108L18.4995 8.5725L19.4295 9.4995L12.426 16.5H11.499L4.5 9.4995L5.4285 8.5725L11.964 15.108Z"
        fill={C.textPrimary}
      />
    </Svg>
  );
}

function digitsOnly(value: string, maxDigits: number): string {
  return value.replace(/\D/g, '').slice(0, maxDigits);
}

function formatUsPhone(digits: string): string {
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${a}`;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function formatPhoneDisplay(digits: string, country: Country): string {
  if (country.iso2 === 'US' || country.iso2 === 'CA') {
    return formatUsPhone(digits);
  }
  return digits;
}

function phonePlaceholder(country: Country): string {
  if (country.iso2 === 'US' || country.iso2 === 'CA') {
    return '(___) ___-____';
  }
  return 'Phone number';
}

type CountryPickerProps = {
  visible: boolean;
  selectedIso2: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

/** Scrim appears immediately; only the sheet slides up (matches EventsViewAllModal). */
function CountryPickerModal({
  visible,
  selectedIso2,
  onSelect,
  onClose,
}: CountryPickerProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const sheetMaxHeight = windowHeight * 0.7;
  const dismissTravel = sheetMaxHeight + insets.bottom + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const scrimOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    scrimOpacity.value = withTiming(0, { duration: 320, easing: easing.drawer });
    translateY.value = withTiming(
      dismissTravel,
      { duration: 320, easing: easing.drawer },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }, [dismissTravel, onClose, reducedMotion, scrimOpacity, translateY]);

  useEffect(() => {
    if (!visible) return;
    translateY.value = dismissTravel;
    scrimOpacity.value = 0;
    if (reducedMotion) {
      translateY.value = 0;
      scrimOpacity.value = 1;
    } else {
      translateY.value = withSpring(0, { ...modalSpring, overshootClamping: true });
      scrimOpacity.value = withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
    }
  }, [dismissTravel, reducedMotion, scrimOpacity, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={s.modalRoot}>
        <Animated.View style={[s.modalScrim, scrimStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismiss}
          accessibilityLabel="Close country list"
        />
        <Animated.View style={[s.modalSheetWrap, sheetStyle]}>
          <View style={[s.modalSheet, { maxHeight: sheetMaxHeight }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Country code</Text>
              <AnimatedPressable
                onPress={dismiss}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={s.modalDone}>Done</Text>
              </AnimatedPressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.iso2}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
              getItemLayout={(_data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              renderItem={({ item }) => {
                const selected = item.iso2 === selectedIso2;
                return (
                  <Pressable
                    style={[s.countryRow, selected && s.countryRowSelected]}
                    onPress={() => {
                      onSelect(item);
                      dismiss();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${item.name}, plus ${item.dialCode}`}
                  >
                    <Text style={s.countryFlag}>{item.flag}</Text>
                    <Text style={s.countryName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={s.countryDial}>+{item.dialCode}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Figma `details_account` phone step (712:323) — onboarding step 2 of 5. */
export function AccountPhoneScreen() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [digits, setDigits] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const display = useMemo(
    () => formatPhoneDisplay(digits, country),
    [digits, country],
  );

  if (!fontsLoaded) return <View style={s.root} />;

  const phoneError = validatePhone(digits, country);
  const showPhoneError = (submitted || touched) ? phoneError : undefined;

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={s.content} onPress={dismissKeyboard}>
            <View style={s.form}>
              <OnboardingProgressPills active={2} total={7} />

              <View style={s.titleSection}>
                <Text style={s.title}>A few details</Text>
                <Text style={s.subtitle}>
                  We need this information to help tailor your clean-up experience and verify your impact.
                </Text>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Phone Number</Text>
                <View style={s.phoneRow}>
                  <AnimatedPressable
                    style={s.countryBtn}
                    onPress={() => {
                      dismissKeyboard();
                      setPickerOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Country code ${country.name}`}
                    accessibilityState={{ expanded: pickerOpen }}
                  >
                    <Text style={s.flagEmoji} accessibilityLabel={country.name}>
                      {country.flag}
                    </Text>
                    <ChevronDown />
                  </AnimatedPressable>

                  <View style={s.phoneFieldCol}>
                    <View style={[s.phoneField, showPhoneError ? s.fieldError : null]}>
                      <Text style={s.dialCode}>+{country.dialCode}</Text>
                      <TextInput
                        style={s.phoneInput}
                        value={display}
                        onChangeText={(text) =>
                          setDigits(digitsOnly(text, country.maxDigits))
                        }
                        onBlur={() => setTouched(true)}
                        keyboardType="phone-pad"
                        placeholder={phonePlaceholder(country)}
                        placeholderTextColor={C.textNavInactive}
                        accessibilityLabel="Phone number"
                        textContentType="telephoneNumber"
                      />
                    </View>
                    {showPhoneError ? <Text style={s.errorText}>{showPhoneError}</Text> : null}
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <OnboardingInfoFooterActions
          onContinue={() => {
            dismissKeyboard();
            setSubmitted(true);
            if (phoneError) return;
            router.push('/account-details');
          }}
          onPrevious={() => {
            dismissKeyboard();
            router.back();
          }}
          hideSkip
        />
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={pickerOpen}
        selectedIso2={country.iso2}
        onSelect={(item) => {
          setCountry(item);
          setDigits((prev) => digitsOnly(prev, item.maxDigits));
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 180,
  },
  content: {
    flexGrow: 1,
  },
  form: {
    gap: 30,
  },
  titleSection: {
    gap: 15,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textNavInactive,
    lineHeight: 22,
  },
  fieldSection: {
    gap: 20,
  },
  fieldLabel: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  countryBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  phoneField: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  phoneFieldCol: {
    flex: 1,
  },
  fieldError: {
    borderColor: C.statusDeclinedBorder,
  },
  errorText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.statusDeclinedText,
    marginTop: 2,
    marginLeft: 4,
  },
  dialCode: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlayScrim,
  },
  modalSheetWrap: {
    width: '100%',
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 20,
    color: C.textPrimary,
  },
  modalDone: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.primary,
  },
  countryRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  countryRowSelected: {
    backgroundColor: C.statusApprovedBg,
  },
  countryFlag: {
    fontSize: 24,
    lineHeight: 28,
    width: 36,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },
  countryDial: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
  },
});
