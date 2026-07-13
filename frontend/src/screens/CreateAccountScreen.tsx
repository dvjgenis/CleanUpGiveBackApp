import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  AppleIcon,
  EmailIcon,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


/** Figma `create_account` (105:2) — onboarding step 1 of 5. */
export function CreateAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  const goNext = () => router.push('/creating-account');

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
            <TextInput
              style={s.input}
              placeholder="Name"
              placeholderTextColor={C.textNavInactive}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="name"
              accessibilityLabel="Name"
            />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={C.textNavInactive}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={C.textNavInactive}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              accessibilityLabel="Password"
            />
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
              onPress={goNext}
            />
            <SocialButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              onPress={goNext}
            />
            <SocialButton
              label="Continue with Email"
              icon={<EmailIcon />}
              onPress={goNext}
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
    gap: 30,
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
