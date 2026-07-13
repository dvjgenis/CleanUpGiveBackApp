import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrivacyPolicyDetailScreen } from '@/features/figma-screens/screens/PrivacyPolicyDetailScreen';
import { colors } from '@/features/figma-screens/tokens';

const SECTIONS = [
  {
    title: 'Overview',
    body: 'We work to keep your information safe. No app can promise perfect security. But we take important steps to protect your data, including encryption, access limits, and careful choice of service partners.',
  },
  {
    title: 'Encryption',
    body: 'Your data is scrambled when it moves between your phone and our servers. This is called encryption. Your data is also protected when it is stored. This makes it harder for others to read your information if they intercept it.',
  },
  {
    title: 'Access controls',
    body: 'Only approved staff can access user data. They can only access it when needed for support, security, or legal compliance. We limit access based on job role.',
  },
  {
    title: 'Secure partners',
    body: 'We use trusted companies like Supabase, Stripe, and Google to run the app. These partners must follow strong security practices and use your data only to provide their service to us.',
  },
  {
    title: 'Your role',
    body: "Use a strong password that you do not use on other sites. Do not share your login with anyone. Turn on your phone's screen lock. Contact us right away if you think someone else accessed your account.",
  },
  {
    title: 'If something goes wrong',
    body: 'Email privacy@cleanupgiveback.org if you think your data was accessed without permission. Tell us what happened and we will investigate. We will also explain what steps you can take to protect your account.',
  },
  {
    title: 'How we store data',
    body: 'Your account and session data are stored in secure cloud systems. We use industry standard tools to reduce the risk of unauthorized access.',
  },
  {
    title: 'Keeping data after deletion',
    body: 'When you delete your account or request deletion, we remove your data from active systems. Some information may remain in backups for a short time. We may also keep certain records if the law requires it.',
  },
];

export default function PrivacyHowWeProtectRoute() {
  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgApp }} />;
  }

  return (
    <SafeAreaProvider>
      <PrivacyPolicyDetailScreen sectionTitle="How we protect it" sections={SECTIONS} />
    </SafeAreaProvider>
  );
}
