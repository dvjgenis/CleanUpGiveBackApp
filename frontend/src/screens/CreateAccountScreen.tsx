import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  AppleIcon,
  EmailIcon,
  EyeOffIcon,
  EyeOpenIcon,
  GoogleIcon,
} from '@/components/onboarding/OnboardingIcons';
import { OnboardingProgressPills } from '@/components/onboarding/OnboardingProgressPills';
import { colors as C } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, password: string) {
  const errors: { name?: string; email?: string; password?: string } = {};
  if (!name.trim()) errors.name = 'Name is required';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
}

/** Figma `create_account` (105:2) — onboarding step 1 of 5. */
export function CreateAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const errors = validate(name, email, password);
  const showError = (field: keyof typeof errors) =>
    (submitted || touched[field]) ? errors[field] : undefined;

  const goNext = () => {
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      router.push('/creating-account');
    }
  };

  /** Prototype: social/provider CTAs advance without real auth or form validation. */
  const skipAuthNext = () => {
    router.push('/creating-account');
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
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgressPills active={1} />

          <Text style={s.title}>Create your account</Text>

          <View style={s.fields}>
            <View>
              <TextInput
                style={[s.input, showError('name') ? s.inputError : null]}
                placeholder="Name"
                placeholderTextColor={C.textNavInactive}
                value={name}
                onChangeText={setName}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                autoCapitalize="words"
                textContentType="name"
                accessibilityLabel="Name"
              />
              {showError('name') ? <Text style={s.errorText}>{showError('name')}</Text> : null}
            </View>

            <View>
              <TextInput
                style={[s.input, showError('email') ? s.inputError : null]}
                placeholder="Email"
                placeholderTextColor={C.textNavInactive}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Email"
              />
              {showError('email') ? <Text style={s.errorText}>{showError('email')}</Text> : null}
            </View>

            <View>
              <View style={[s.passwordWrap, showError('password') ? s.inputError : null]}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={C.textNavInactive}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  accessibilityLabel="Password"
                />
                <Pressable
                  style={s.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={8}
                >
                  {showPassword
                    ? <EyeOpenIcon size={20} color={C.textNavInactive} />
                    : <EyeOffIcon size={20} color={C.textNavInactive} />
                  }
                </Pressable>
              </View>
              {showError('password') ? <Text style={s.errorText}>{showError('password')}</Text> : null}
            </View>
          </View>

          <AnimatedPressable
            style={s.primaryBtn}
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            <Text style={s.primaryBtnText}>Create Account</Text>
          </AnimatedPressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>or</Text>
            <View style={s.orLine} />
          </View>

          <View style={s.socialStack}>
            <SocialButton
              label="Continue with Apple"
              icon={<AppleIcon />}
              onPress={skipAuthNext}
            />
            <SocialButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              onPress={skipAuthNext}
            />
            <SocialButton
              label="Continue with Email"
              icon={<EmailIcon />}
              onPress={skipAuthNext}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={s.socialBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.socialInner}>
        {icon}
        <Text style={s.socialText}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 32,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 34,
    color: C.textPrimary,
    marginTop: 0,
  },
  fields: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
    backgroundColor: C.bgApp,
  },
  inputError: {
    borderColor: C.statusDeclinedBorder,
  },
  errorText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.statusDeclinedText,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    backgroundColor: C.bgApp,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  primaryBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.borderOutline,
  },
  orText: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },
  socialStack: {
    gap: 18,
  },
  socialBtn: {
    backgroundColor: C.textPrimary,
    borderRadius: 16,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  socialText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
});
