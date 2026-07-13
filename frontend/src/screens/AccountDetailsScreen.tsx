import { useCallback, useEffect, useState } from 'react';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { SessionSetupCalendarIcon } from '@/components/session-setup/icons/SessionSetupCalendarIcon';
import { DateWheelPicker } from '@/features/figma-screens/components/DateWheelPicker';
import { colors as C } from '@/features/figma-screens/tokens';
import { durations, easing, modalSpring } from '@/motion';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
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


const SERVICE_TYPES = ['Court Ordered', 'Volunteering', 'School', 'Other'] as const;
type ServiceType = (typeof SERVICE_TYPES)[number];

const SHEET_BOTTOM_BLEED = 48;
const DEFAULT_PICKER_DATE = new Date(2000, 0, 1);

function ageFromMonthYear(birthday: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthday.getFullYear();
  const monthDiff = now.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthday.getDate())) {
    age -= 1;
  }
  return age;
}

/** Format as MM/YYYY while typing (digits only, max 6). */
function formatBirthdayDraft(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatBirthdayLabel(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${mm}/${date.getFullYear()}`;
}

/** Parse MM/YYYY (or M/YYYY) into the 1st of that month. */
function parseBirthdayDraft(text: string): Date | null {
  const match = text.trim().match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const now = new Date();
  if (year < 1900 || year > now.getFullYear()) return null;
  const date = new Date(year, month - 1, 1);
  if (date > now) return null;
  return date;
}

function CalendarIcon({ color = C.textTertiary }: { color?: string }) {
  return <SessionSetupCalendarIcon color={color} size={18} />;
}

type BirthdayPickerProps = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onClose: () => void;
};

/** Scrim fades with the sheet; Modal unmounts when exit finishes. */
function BirthdayPickerModal({
  visible,
  value,
  onChange,
  onConfirm,
  onClose,
}: BirthdayPickerProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const sheetHeight = 280 + insets.bottom;
  const dismissTravel = Math.min(windowHeight * 0.55, sheetHeight) + SHEET_BOTTOM_BLEED;
  const translateY = useSharedValue(dismissTravel);
  const backdropOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    // Fade scrim immediately so the dimmed screen does not linger while the
    // sheet spring settles (sheetDismissSpring can take >1s to finish).
    backdropOpacity.value = withTiming(0, {
      duration: durations.sheetDismiss,
      easing: easing.drawer,
    });
    translateY.value = withTiming(
      dismissTravel,
      { duration: durations.sheetDismiss, easing: easing.drawer },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      },
    );
  }, [backdropOpacity, dismissTravel, onClose, reducedMotion, translateY]);

  const confirm = useCallback(() => {
    onConfirm(value);
    dismiss();
  }, [dismiss, onConfirm, value]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    translateY.value = dismissTravel;
    translateY.value = reducedMotion
      ? 0
      : withSpring(0, { ...modalSpring, overshootClamping: true });
    backdropOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: durations.modalEnter, easing: easing.easeOut });
  }, [backdropOpacity, dismissTravel, reducedMotion, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
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
        <Animated.View style={[s.modalScrim, backdropStyle]} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismiss}
          accessibilityLabel="Close birthday picker"
        />
        <Animated.View style={[s.modalSheetWrap, sheetStyle]}>
          <View style={[s.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Birthday</Text>
              <AnimatedPressable
                onPress={confirm}
                accessibilityRole="button"
                accessibilityLabel="Confirm birthday"
              >
                <Text style={s.modalDone}>Done</Text>
              </AnimatedPressable>
            </View>
            <DateWheelPicker value={value} onChange={onChange} includeDay={false} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Figma `details_account` (112:6882) — account onboarding step 3 of 5. */
export function AccountDetailsScreen() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [birthdayText, setBirthdayText] = useState('');
  const [pickerDate, setPickerDate] = useState(DEFAULT_PICKER_DATE);
  const [showPicker, setShowPicker] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

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

  const openPicker = () => {
    Keyboard.dismiss();
    setPickerDate(birthday ?? DEFAULT_PICKER_DATE);
    setShowPicker(true);
  };

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
          <Pressable style={s.content} onPress={Keyboard.dismiss}>
            <View style={s.form}>
              <OnboardingProgressPills active={3} />

              <View style={s.titleSection}>
                <Text style={s.title}>A few details</Text>
                <Text style={s.subtitle}>
                  We need this information to help tailor your clean-up experience and verify your impact.
                </Text>
              </View>

              <View style={s.formSection}>
                <Text style={s.sectionTitle}>Birthday</Text>
                <View style={s.dateField}>
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
                    onBlur={commitTypedBirthday}
                    onSubmitEditing={commitTypedBirthday}
                    placeholder="MM/YYYY"
                    placeholderTextColor={C.textTertiary}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={7}
                    accessibilityLabel="Birthday month and year"
                  />
                  <AnimatedPressable
                    style={s.calendarBtn}
                    onPress={openPicker}
                    accessibilityRole="button"
                    accessibilityLabel="Open birthday picker"
                    hitSlop={8}
                  >
                    <CalendarIcon />
                  </AnimatedPressable>
                </View>
              </View>

              <View style={s.formSection}>
                <Text style={s.sectionTitle}>Service Type</Text>
                <View style={s.serviceGrid}>
                  <View style={s.serviceRow}>
                    {(SERVICE_TYPES.slice(0, 2) as ServiceType[]).map((type) => (
                      <ServiceTypeButton
                        key={type}
                        label={type}
                        selected={serviceType === type}
                        onPress={() => setServiceType(type)}
                      />
                    ))}
                  </View>
                  <View style={s.serviceRow}>
                    {(SERVICE_TYPES.slice(2) as ServiceType[]).map((type) => (
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

            <View style={s.footer}>
              <AnimatedPressable
                style={s.continueBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  commitTypedBirthday();
                  const resolved = parseBirthdayDraft(birthdayText) ?? birthday;
                  if (resolved && ageFromMonthYear(resolved) < 18) {
                    router.push('/under-age');
                    return;
                  }
                  router.push('/notification-preference');
                }}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={s.continueBtnText}>Continue</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={s.previousBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityLabel="Previous"
              >
                <Text style={s.previousBtnText}>Previous</Text>
              </AnimatedPressable>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <BirthdayPickerModal
        visible={showPicker}
        value={pickerDate}
        onChange={setPickerDate}
        onConfirm={(date) => {
          setBirthday(date);
          setBirthdayText(formatBirthdayLabel(date));
        }}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
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
    backgroundColor: C.bgApp,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
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
    color: C.textTertiary,
    lineHeight: 22,
  },
  formSection: {
    gap: 20,
  },
  sectionTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },
  dateField: {
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  calendarBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceGrid: {
    gap: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  serviceBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.statusApprovedBg,
  },
  serviceBtnText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.textTertiary,
    textAlign: 'center',
  },
  serviceBtnTextActive: {
    color: C.primary,
  },
  footer: {
    gap: 20,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  continueBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  previousBtn: {
    borderWidth: 1,
    borderColor: C.textPrimary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previousBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textPrimary,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderOutline,
  },
  modalTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },
  modalDone: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },
});
