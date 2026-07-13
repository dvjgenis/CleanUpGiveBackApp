import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  EyeOffIcon,
  EyeOpenIcon,
  WelcomeBurstIcon,
  WelcomeLogoMark,
  WelcomeUnderline,
} from '@/components/onboarding/OnboardingIcons';
import { markOnboardingComplete } from '@/features/onboarding/onboardingStore';
import { colors as C, radius } from '@/features/figma-screens/tokens';
import {
  IBMPlexSans_400Regular,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Figma `welcome` (112:6776) — post-splash login / create-account entry. */
export function WelcomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <View style={s.hero}>
        <ExpoImage
          source={require('@/assets/figma/onboarding/welcome-hero.png')}
          style={s.heroImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessibilityLabel="Volunteers at a CleanUp Give Back event"
        />
        <View style={s.heroDim} />
        <LinearGradient
          colors={['rgba(0,149,64,0)', 'rgba(0,149,64,0.4)', C.primary]}
          locations={[0, 0.5, 1]}
          style={s.heroGradient}
        />
        <SafeAreaView edges={['top']} style={s.logoWrap} pointerEvents="none">
          <WelcomeLogoMark width={29} height={38} />
        </SafeAreaView>
      </View>

      <SafeAreaView style={s.formSafe} edges={['bottom']}>
        <View style={s.form}>
          {/* Figma Title Section 137:900 — burst @ (0,0); text inset 10.5/5; squiggle under impact. */}
          <View style={s.titleBlock}>
            <View style={s.burstWrap} pointerEvents="none">
              <WelcomeBurstIcon size={16} />
            </View>
            <View style={s.titleTextWrap}>
              <View style={s.titleLine}>
                <Text style={[s.title, s.titleWhite]}>Track your service. </Text>
                <Text style={[s.title, s.titleLime]}>Prove your </Text>
                <View style={s.impactWord}>
                  <Text style={[s.title, s.titleLime]}>impact.</Text>
                  <View style={s.underlineWrap} pointerEvents="none">
                    <WelcomeUnderline width={83} height={7} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={s.fields}>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="rgba(252,249,248,0.6)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />
            <View style={s.passwordWrap}>
              <TextInput
                style={s.passwordInput}
                placeholder="Password"
                placeholderTextColor="rgba(252,249,248,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
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
                  ? <EyeOpenIcon size={20} color="rgba(252,249,248,0.8)" />
                  : <EyeOffIcon size={20} color="rgba(252,249,248,0.8)" />
                }
              </Pressable>
            </View>
          </View>

          <AnimatedPressable
            style={s.loginBtn}
            onPress={() => {
              markOnboardingComplete();
              router.replace('/');
            }}
            accessibilityRole="button"
            accessibilityLabel="Log In"
          >
            <Text style={s.loginBtnText}>Log In</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
          >
            <Text style={s.forgot}>Forgot Password?</Text>
          </AnimatedPressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>or</Text>
            <View style={s.orLine} />
          </View>

          <AnimatedPressable
            style={s.createBtn}
            onPress={() => router.push('/create-account')}
            accessibilityRole="button"
            accessibilityLabel="Create an Account"
          >
            <Text style={s.createBtnText}>Create an Account</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
  },
  hero: {
    height: 405,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  logoWrap: {
    position: 'absolute',
    left: 16,
    top: 0,
    paddingTop: 8,
  },
  formSafe: {
    flex: 1,
    marginTop: -78,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 20,
  },
  /** Figma `137:900` — burst @ (0,0); text inset 10.5 / 5; squiggle under “impact.” */
  titleBlock: {
    position: 'relative',
    minHeight: 72,
    width: '100%',
  },
  burstWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  titleTextWrap: {
    marginLeft: 10.5,
    marginTop: 5,
  },
  titleLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    lineHeight: 30,
  },
  titleWhite: {
    color: C.bgApp,
  },
  titleLime: {
    color: C.accentLime,
  },
  impactWord: {
    alignItems: 'flex-start',
  },
  underlineWrap: {
    marginTop: 2,
    width: 83,
    height: 7,
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
    color: C.bgApp,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.bgApp,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  loginBtn: {
    backgroundColor: C.bgApp,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loginBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },
  forgot: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.bgApp,
    textAlign: 'center',
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
    color: C.bgApp,
  },
  createBtn: {
    backgroundColor: C.textPrimary,
    borderRadius: radius.md,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },
});
