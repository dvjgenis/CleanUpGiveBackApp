import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useAttentionShake, useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SessionSetupDateField,
  type SessionSetupDateFieldRef,
} from '@/components/session-setup/SessionSetupDateField';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { CameraIcon } from '@/features/session-tracking/components/icons/CameraIcon';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import {
  clearPendingSessionSetup,
  setPendingSessionSetupForm,
} from '@/features/session-tracking/pendingSessionSetup';
import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
} from '@/utils/sessionPermissions';

import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  labelOptional: tokens.borderOutline,
  statusDeclined: tokens.statusDeclinedText,
} as const;

type FieldErrors = {
  activity: boolean;
  date: boolean;
  location: boolean;
  camera: boolean;
};

const EMPTY_FIELD_ERRORS: FieldErrors = {
  activity: false,
  date: false,
  location: false,
  camera: false,
};

function ValidationToastAlert({ labels }: { labels: string[] }) {
  const shakeStyle = useAttentionShake();

  return (
    <Animated.View
      style={[s.validationToast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.validationToastTitle}>There are missing fields</Text>
      {labels.map((label) => (
        <Text key={label} style={s.validationToastLine}>
          {'\u2022  '}
          {label}
        </Text>
      ))}
    </Animated.View>
  );
}

/** Figma `session_setup_guide` form (260:1312) — PRD §6.9 session setup. */
export function SessionSetupFormScreen() {
  const router = useRouter();
  const [activity, setActivity] = useState('');
  const [courtOrdered, setCourtOrdered] = useState(false);
  const [description, setDescription] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [sessionDate, setSessionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [missingLabels, setMissingLabels] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const dateFieldRef = useRef<SessionSetupDateFieldRef>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });
  // Default the permission toggles to "on" when the OS has already granted
  // them (e.g. via the onboarding or session-setup-guide permission prompts),
  // so the user doesn't have to re-enable something iOS already allows.
  useEffect(() => {
    let isMounted = true;

    void isSessionLocationPermissionGranted().then((granted) => {
      if (isMounted && granted) {
        setLocationEnabled(true);
      }
    });
    void isSessionCameraPermissionGranted().then((granted) => {
      if (isMounted && granted) {
        setCameraEnabled(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const introStyle = useFadeUpEnter(0);
  const fieldsStyle = useFadeUpEnter(staggerDelay(1));
  const permissionsStyle = useFadeUpEnter(staggerDelay(2));
  const ctaStyle = useFadeUpEnter(staggerDelay(3));

  const handleBack = () => {
    clearPendingSessionSetup();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/session-setup-complete');
  };

  const collectValidationErrors = (
    activityValue: string,
    dateValid: boolean,
    locationOn: boolean,
    cameraOn: boolean,
  ) => {
    const missing: string[] = [];
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (!activityValue.trim()) {
      missing.push('What activity is this?');
      errors.activity = true;
    }

    if (!dateValid) {
      missing.push('Date');
      errors.date = true;
    }

    if (!locationOn) {
      missing.push('Location');
      errors.location = true;
    }

    if (!cameraOn) {
      missing.push('Camera');
      errors.camera = true;
    }

    return { missing, errors };
  };

  const applyValidationState = (
    activityValue: string,
    dateValid: boolean,
    locationOn: boolean,
    cameraOn: boolean,
  ) => {
    const { missing, errors } = collectValidationErrors(
      activityValue,
      dateValid,
      locationOn,
      cameraOn,
    );
    setFieldErrors(errors);
    setMissingLabels(missing);
    setShowValidationToast(missing.length > 0);
    return missing.length === 0;
  };

  const refreshValidationFeedback = (
    nextActivity = activity,
    nextLocation = locationEnabled,
    nextCamera = cameraEnabled,
  ) => {
    if (!showValidationToast) {
      return;
    }
    const dateValid = dateFieldRef.current?.validate() ?? false;
    applyValidationState(nextActivity, dateValid, nextLocation, nextCamera);
  };

  const handleStartSession = () => {
    if (isStarting) {
      return;
    }

    Keyboard.dismiss();

    const dateValid = dateFieldRef.current?.validate() ?? false;
    const isValid = applyValidationState(activity, dateValid, locationEnabled, cameraEnabled);

    if (!isValid) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFieldErrors(EMPTY_FIELD_ERRORS);
    setShowValidationToast(false);
    setIsStarting(true);

    setPendingSessionSetupForm({
      activity: activity.trim(),
      dateIso: sessionDate.toISOString(),
      courtOrdered,
      description: description.trim(),
    });
    router.replace('/photo-capture?mode=session-start' as Href);
  };

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionSetupTopAppBar title="Session Setup" onBack={handleBack} />
        {showValidationToast && missingLabels.length > 0 ? (
          <ValidationToastAlert labels={missingLabels} />
        ) : null}
      </View>

      <SafeAreaView style={s.body} edges={['bottom']}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Animated.View style={introStyle}>
          <View style={s.introCard}>
            <Text style={s.introTitle}>Ready to Make an Impact?</Text>
            <Text style={s.introSubtitle}>
              Fill out the details to start tracking your clean-up session. Nighttime cleanings are
              not allowed.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[fieldsStyle, s.fieldsStack]}>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, fieldErrors.activity && s.fieldLabelError]}>
            What activity is this?*
          </Text>
          <TextInput
            value={activity}
            onChangeText={(text) => {
              setActivity(text);
              if (showValidationToast) {
                requestAnimationFrame(() =>
                  refreshValidationFeedback(text, locationEnabled, cameraEnabled),
                );
              }
            }}
            style={[s.input, fieldErrors.activity && s.inputError]}
            placeholderTextColor={C.labelOptional}
            accessibilityLabel="Activity name"
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, fieldErrors.date && s.fieldLabelError]}>Date*</Text>
          <SessionSetupDateField
            ref={dateFieldRef}
            value={sessionDate}
            onChange={setSessionDate}
            hasError={fieldErrors.date}
            onInteraction={() => {
              if (showValidationToast) {
                requestAnimationFrame(() => refreshValidationFeedback());
              }
            }}
          />
        </View>

        <View style={s.surfaceCard}>
          <View style={s.surfaceCardText}>
            <Text style={s.surfaceCardTitle}>Court Ordered Status</Text>
            <Text style={s.surfaceCardSubtitle}>
              Does this session count towards mandated hours?
            </Text>
          </View>
          <SessionSetupToggle
            value={courtOrdered}
            onValueChange={setCourtOrdered}
            accessibilityLabel="Court ordered status"
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>
            Description <Text style={s.optionalLabel}>(Optional)</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[s.input, s.textArea]}
            multiline
            textAlignVertical="top"
            placeholderTextColor={C.labelOptional}
            accessibilityLabel="Session description"
          />
        </View>
        </Animated.View>

        <Animated.View style={permissionsStyle}>
        <View style={[s.permissionsCard, (fieldErrors.location || fieldErrors.camera) && s.permissionsCardError]}>
          <Text
            style={[
              s.surfaceCardTitle,
              (fieldErrors.location || fieldErrors.camera) && s.fieldLabelError,
            ]}
          >
            Required Permissions*
          </Text>

          <View style={[s.permissionRow, fieldErrors.location && s.permissionRowError]}>
            <View style={s.permissionLabel}>
              <LocationPinIcon color={C.textTertiary} size={18} strokeWidth={1.5} />
              <Text style={[s.permissionText, fieldErrors.location && s.fieldLabelError]}>
                Location
              </Text>
            </View>
            <SessionSetupToggle
              value={locationEnabled}
              onValueChange={(value) => {
                setLocationEnabled(value);
                if (showValidationToast) {
                  requestAnimationFrame(() =>
                    refreshValidationFeedback(activity, value, cameraEnabled),
                  );
                }
              }}
              accessibilityLabel="Location permission"
            />
          </View>

          <View style={[s.permissionRow, fieldErrors.camera && s.permissionRowError]}>
            <View style={s.permissionLabel}>
              <CameraIcon color={C.textTertiary} size={18} strokeWidth={1.5} />
              <Text style={[s.permissionText, fieldErrors.camera && s.fieldLabelError]}>
                Camera
              </Text>
            </View>
            <SessionSetupToggle
              value={cameraEnabled}
              onValueChange={(value) => {
                setCameraEnabled(value);
                if (showValidationToast) {
                  requestAnimationFrame(() =>
                    refreshValidationFeedback(activity, locationEnabled, value),
                  );
                }
              }}
              accessibilityLabel="Camera permission"
            />
          </View>
        </View>
        </Animated.View>

        <Animated.View style={ctaStyle}>
        <AnimatedPressable
          style={[s.startBtn, isStarting && s.startBtnDisabled]}
          onPress={() => {
            void handleStartSession();
          }}
          disabled={isStarting}
          accessibilityRole="button"
          accessibilityLabel="Start session"
          accessibilityState={{ disabled: isStarting }}
        >
          <Text style={s.startBtnText}>{isStarting ? 'Starting…' : 'Start Session'}</Text>
        </AnimatedPressable>
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topSection: {
    zIndex: 10,
    backgroundColor: C.bgApp,
  },

  validationToast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#ffd9de',
    borderWidth: 1,
    borderColor: C.statusDeclined,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  validationToastTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclined,
    marginBottom: 2,
  },

  validationToastLine: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    color: C.textPrimary,
  },

  scroll: {
    flex: 1,
  },

  body: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 30,
  },

  fieldsStack: {
    gap: 30,
  },

  introCard: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 6,
  },

  introTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },

  introSubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: C.textTertiary,
    lineHeight: 18,
  },

  fieldGroup: {
    gap: 15,
  },

  fieldLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: C.textPrimary,
  },

  fieldLabelError: {
    color: C.statusDeclined,
  },

  optionalLabel: {
    color: C.labelOptional,
  },

  input: {
    height: 48,
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },

  inputError: {
    borderColor: C.statusDeclined,
  },

  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },

  surfaceCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 96,
  },

  surfaceCardText: {
    flex: 1,
    gap: 2,
  },

  surfaceCardTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textPrimary,
  },

  surfaceCardSubtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
    lineHeight: 16,
  },

  permissionsCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 21,
    gap: 10,
  },

  permissionsCardError: {
    borderColor: C.statusDeclined,
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: -8,
  },

  permissionRowError: {
    borderColor: C.statusDeclined,
  },

  permissionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  permissionText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
  },

  startBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 30,
  },

  startBtnDisabled: {
    opacity: 0.7,
  },

  startBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
});
