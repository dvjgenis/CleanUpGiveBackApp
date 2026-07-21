import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupCalendarIcon } from '@/components/session-setup/icons/SessionSetupCalendarIcon';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { SERVICE_TYPES, type ServiceType } from '@/constants/serviceTypes';
import { AccountChevronIcon } from '../components/AccountIcons';
import {
  ageFromBirthday,
  BirthdayPickerModal,
  DEFAULT_BIRTHDAY_PICKER_DATE,
  formatBirthdayDraft,
  formatBirthdayLabel,
  parseBirthdayDraft,
} from '../components/BirthdayPickerModal';
import {
  CountryChevronDownIcon,
  CountryPickerModal,
  digitsOnly,
  formatPhoneDisplay,
  phoneDisplayMaxLength,
  phonePlaceholder,
  validatePhone,
} from '../components/CountryPickerModal';
import { SuccessConfirmationModal } from '../components/SuccessConfirmationModal';
import { colors, fontFamilies, radius, shadows } from '../tokens';
import {
  getEmail,
  getPhoneCountryIso2,
  getPhoneDigits,
  getPreferredName,
  usePersonalDetails,
  setBirthday as persistBirthday,
  setEmail as persistEmail,
  setPhone as persistPhone,
  setPreferredName as persistPreferredName,
  setServiceType as persistServiceType,
} from '@/features/onboarding/onboardingStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOOTER_PAD_TOP = 18;
const PRIMARY_FOOTER_BTN_HEIGHT = 52;

function validateName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  return undefined;
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address';
  return undefined;
}

function validateBirthdayField(birthday: Date | null, birthdayText: string): string | undefined {
  if (!birthdayText.trim()) return 'Birthday is required';
  if (!birthday) return 'Enter a valid birthday (MM/YYYY)';
  if (ageFromBirthday(birthday) < 13) return 'You must be at least 13 years old';
  return undefined;
}

/**
 * Account → Personal Details editor. Lets the user update the name, phone
 * number, birthday, and service type (court ordered, volunteering, etc.)
 * collected during onboarding.
 */
export function PersonalDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stored = usePersonalDetails();

  const [name, setName] = useState(() => getPreferredName());
  const [email, setEmail] = useState(() => getEmail());
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((item) => item.iso2 === getPhoneCountryIso2()) ?? DEFAULT_COUNTRY,
  );
  const [digits, setDigits] = useState(() => getPhoneDigits());
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [birthday, setBirthday] = useState<Date | null>(stored.birthday);
  const [birthdayText, setBirthdayText] = useState(() =>
    stored.birthday ? formatBirthdayLabel(stored.birthday) : '',
  );
  const [pickerDate, setPickerDate] = useState(() => stored.birthday ?? DEFAULT_BIRTHDAY_PICKER_DATE);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType | null>(stored.serviceType);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; phone?: boolean; birthday?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const phoneError = validatePhone(digits, country);
  const birthdayError = validateBirthdayField(birthday, birthdayText);
  const showError = (field: keyof typeof touched, error: string | undefined) =>
    (submitted || touched[field]) ? error : undefined;

  const phoneDisplay = formatPhoneDisplay(digits, country);

  const footerBottom = Math.max(insets.bottom, 12);
  const scrollBottomPad = FOOTER_PAD_TOP + PRIMARY_FOOTER_BTN_HEIGHT + footerBottom + 16;

  const dismissKeyboard = () => Keyboard.dismiss();

  const commitTypedBirthday = () => {
    const parsed = parseBirthdayDraft(birthdayText);
    if (parsed) {
      setBirthday(parsed);
      setPickerDate(parsed);
      setBirthdayText(formatBirthdayLabel(parsed));
      return;
    }
    if (birthday) {
      setBirthdayText(formatBirthdayLabel(birthday));
      return;
    }
    setBirthdayText(formatBirthdayDraft(birthdayText));
  };

  const openBirthdayPicker = () => {
    dismissKeyboard();
    setPickerDate(birthday ?? DEFAULT_BIRTHDAY_PICKER_DATE);
    setShowBirthdayPicker(true);
  };

  function handleSave() {
    dismissKeyboard();
    commitTypedBirthday();
    setSubmitted(true);

    const resolvedBirthday = parseBirthdayDraft(birthdayText) ?? birthday;
    if (
      validateName(name) ||
      validateEmail(email) ||
      validatePhone(digits, country) ||
      validateBirthdayField(resolvedBirthday, birthdayText)
    ) {
      return;
    }

    persistPreferredName(name);
    persistEmail(email);
    persistPhone(country.iso2, digits);
    persistBirthday(resolvedBirthday);
    persistServiceType(serviceType);
    setSaveSuccessVisible(true);
  }

  function handleSaveSuccessDismiss() {
    setSaveSuccessVisible(false);
    router.back();
  }

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top + 14 }]}>
          <AnimatedPressable
            scaleTo={0.97}
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <View style={s.backChevron}>
              <AccountChevronIcon width={16} height={16} />
            </View>
          </AnimatedPressable>
          <Text style={s.topBarTitle}>Personal Details</Text>
          <View style={s.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={s.content} onPress={dismissKeyboard}>
            <View style={s.form}>
              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Name</Text>
                <View>
                  <View style={[s.textField, showError('name', nameError) ? s.fieldError : null]}>
                    <TextInput
                      style={s.textInput}
                      value={name}
                      onChangeText={setName}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      placeholder="Full name"
                      placeholderTextColor={colors.textNavInactive}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      textContentType="name"
                      accessibilityLabel="Name"
                    />
                  </View>
                  {showError('name', nameError) ? (
                    <Text style={s.errorText}>{showError('name', nameError)}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Email</Text>
                <View>
                  <View style={[s.textField, showError('email', emailError) ? s.fieldError : null]}>
                    <TextInput
                      style={s.textInput}
                      value={email}
                      onChangeText={setEmail}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="Email address"
                      placeholderTextColor={colors.textNavInactive}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      accessibilityLabel="Email"
                    />
                  </View>
                  {showError('email', emailError) ? (
                    <Text style={s.errorText}>{showError('email', emailError)}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Phone Number</Text>
                <View style={s.phoneRow}>
                  <AnimatedPressable
                    style={s.countryBtn}
                    onPress={() => {
                      dismissKeyboard();
                      setCountryPickerOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Country code ${country.name}`}
                    accessibilityState={{ expanded: countryPickerOpen }}
                  >
                    <Text style={s.flagEmoji} accessibilityLabel={country.name}>
                      {country.flag}
                    </Text>
                    <CountryChevronDownIcon />
                  </AnimatedPressable>

                  <View style={s.phoneFieldCol}>
                    <View style={[s.phoneField, showError('phone', phoneError) ? s.fieldError : null]}>
                      <Text style={s.dialCode}>+{country.dialCode}</Text>
                      <TextInput
                        style={s.phoneInput}
                        value={phoneDisplay}
                        onChangeText={(text) => setDigits(digitsOnly(text, country.maxDigits))}
                        onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                        keyboardType="phone-pad"
                        maxLength={phoneDisplayMaxLength(country)}
                        placeholder={phonePlaceholder(country)}
                        placeholderTextColor={colors.textNavInactive}
                        accessibilityLabel="Phone number"
                        textContentType="telephoneNumber"
                      />
                    </View>
                    {showError('phone', phoneError) ? (
                      <Text style={s.errorText}>{showError('phone', phoneError)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Birthday</Text>
                <View>
                  <View style={[s.dateField, showError('birthday', birthdayError) ? s.fieldError : null]}>
                    <TextInput
                      style={s.dateInput}
                      value={birthdayText}
                      onChangeText={(text) => {
                        const next = formatBirthdayDraft(text);
                        setBirthdayText(next);
                        const parsed = parseBirthdayDraft(next);
                        if (parsed) {
                          setBirthday(parsed);
                          setPickerDate(parsed);
                        } else if (next.length === 0) {
                          setBirthday(null);
                        }
                      }}
                      onBlur={() => {
                        commitTypedBirthday();
                        setTouched((t) => ({ ...t, birthday: true }));
                      }}
                      onSubmitEditing={commitTypedBirthday}
                      placeholder="MM/YYYY"
                      placeholderTextColor={colors.textNavInactive}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={7}
                      accessibilityLabel="Birthday month and year"
                    />
                    <AnimatedPressable
                      style={s.calendarBtn}
                      onPress={openBirthdayPicker}
                      accessibilityRole="button"
                      accessibilityLabel="Open birthday picker"
                      hitSlop={8}
                    >
                      <SessionSetupCalendarIcon
                        color={showError('birthday', birthdayError) ? colors.statusDeclinedText : colors.textNavInactive}
                        size={18}
                      />
                    </AnimatedPressable>
                  </View>
                  {showError('birthday', birthdayError) ? (
                    <Text style={s.errorText}>{showError('birthday', birthdayError)}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.fieldSection}>
                <Text style={s.fieldLabel}>Service Type</Text>
                <View style={s.serviceGrid}>
                  <View style={s.serviceRow}>
                    {SERVICE_TYPES.slice(0, 2).map((type) => (
                      <ServiceTypeButton
                        key={type}
                        label={type}
                        selected={serviceType === type}
                        onPress={() => setServiceType(type)}
                      />
                    ))}
                  </View>
                  <View style={s.serviceRow}>
                    {SERVICE_TYPES.slice(2).map((type) => (
                      <ServiceTypeButton
                        key={type}
                        label={type}
                        selected={serviceType === type}
                        onPress={() => setServiceType(type)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <AnimatedPressable
          scaleTo={0.98}
          style={s.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save personal details"
        >
          <Text style={s.saveBtnLabel}>Save Changes</Text>
        </AnimatedPressable>
      </View>

      <CountryPickerModal
        visible={countryPickerOpen}
        selectedIso2={country.iso2}
        onSelect={(item) => {
          setCountry(item);
          setDigits((prev) => digitsOnly(prev, item.maxDigits));
        }}
        onClose={() => setCountryPickerOpen(false)}
      />

      <BirthdayPickerModal
        visible={showBirthdayPicker}
        value={pickerDate}
        onChange={setPickerDate}
        onConfirm={(date) => {
          setBirthday(date);
          setBirthdayText(formatBirthdayLabel(date));
        }}
        onClose={() => setShowBirthdayPicker(false)}
      />

      <SuccessConfirmationModal
        visible={saveSuccessVisible}
        message="Your personal details were saved."
        buttonLabel="Done"
        onPress={handleSaveSuccessDismiss}
      />
    </View>
  );
}

function ServiceTypeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={[s.serviceBtn, selected && s.serviceBtnActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[s.serviceBtnText, selected && s.serviceBtnTextActive]}>{label}</Text>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: 4,
  },
  backChevron: {
    transform: [{ rotate: '180deg' }],
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  topBarSpacer: {
    width: 24,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  content: {
    flexGrow: 1,
  },
  form: {
    gap: 24,
  },
  fieldSection: {
    gap: 12,
  },
  fieldLabel: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textField: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
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
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  phoneFieldCol: {
    flex: 1,
  },
  dialCode: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  phoneInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  dateField: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  calendarBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    borderColor: colors.statusDeclinedBorder,
  },
  errorText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusDeclinedText,
    marginTop: 2,
    marginLeft: 4,
  },
  serviceGrid: {
    gap: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  serviceBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.statusApprovedBg,
  },
  serviceBtnText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 15,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  serviceBtnTextActive: {
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingTop: FOOTER_PAD_TOP,
    paddingHorizontal: 16,
    ...shadows.navBottom,
  },
  saveBtn: {
    height: PRIMARY_FOOTER_BTN_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
