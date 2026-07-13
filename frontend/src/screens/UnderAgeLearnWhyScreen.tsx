import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { colors as C, radius } from '@/features/figma-screens/tokens';
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
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';


const REASONS = [
  {
    title: 'We protect younger users',
    body: 'The app collects photos and precise location during cleanup sessions. An admin confirms it is okay before those features turn on.',
  },
  {
    title: 'It is required by law',
    body: 'U.S. privacy laws require extra steps before minors can use apps that collect personal information.',
  },
  {
    title: 'What stays off for now',
    body: 'Camera, location tracking, and session logging remain off until your account is approved.',
  },
  {
    title: 'What to do next',
    body: 'Click the button below to speak to an admin in order to use the app.',
  },
] as const;

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.2426 6.34317L14.8284 4.92896L7.75739 12L14.8285 19.0711L16.2427 17.6569L10.5858 12L16.2426 6.34317Z"
        fill={C.textPrimary}
      />
    </Svg>
  );
}

/** Figma `admin_permission_learn_why` (833:314) — Learn why explainer. */
export function UnderAgeLearnWhyScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.topBar}>
        <AnimatedPressable
          style={s.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackIcon />
          <Text style={s.backText}>Back</Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.intro}>
          <Text style={s.title}>Why admin approval is required</Text>
          <Text style={s.subtitle}>
            Clean Up - Give Back needs an admin to approve accounts for younger users before tracking
            can begin.
          </Text>
        </View>

        <View style={s.reasons}>
          {REASONS.map((reason) => (
            <View key={reason.title} style={s.reasonCard}>
              <Text style={s.reasonTitle}>{reason.title}</Text>
              <Text style={s.reasonBody}>{reason.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <AnimatedPressable
          style={s.contactBtn}
          onPress={() => Linking.openURL('mailto:admin@cleanupgiveback.org')}
          accessibilityRole="button"
          accessibilityLabel="Contact Admin"
        >
          <Text style={s.contactBtnText}>Contact Admin</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  backText: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 16,
    color: C.textPrimary,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 40,
  },

  intro: {
    gap: 20,
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },

  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textNavInactive,
    lineHeight: 20,
  },

  reasons: {
    gap: 20,
  },

  reasonCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },

  reasonTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.textPrimary,
  },

  reasonBody: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textNavInactive,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },

  contactBtn: {
    backgroundColor: C.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  contactBtnText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 18,
    color: C.textOnPrimary,
  },
});
