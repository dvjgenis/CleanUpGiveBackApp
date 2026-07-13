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
    body: 'We use your information to help you track cleanups, manage your account, process payments, and use the app safely. We only use your data for purposes that support these features. This page explains how we use each type of information.',
  },
  {
    title: 'Run your account',
    body: 'Your name, email, and contact details let you sign in, update your profile, and receive important updates about your sessions. We may send you notifications about session reviews, approvals, and account activity if you turn notifications on.',
  },
  {
    title: 'Verify cleanup work',
    body: 'Photos and location from active sessions show where you cleaned and when you worked. This helps confirm your service hours for review and approval. Reviewers use this information to verify that cleanup work was completed.',
  },
  {
    title: 'Process payments',
    body: 'Payment details go to Stripe so you can shop in the app or make donations. We keep a record of your orders and donations linked to your account. We do not store your full card number.',
  },
  {
    title: 'Keep the app safe',
    body: 'Your phone type and app version help us fix bugs and prevent fraud. We may review unusual activity to protect your account and other users.',
  },
  {
    title: 'What we do not do',
    body: 'We do not use your photos or location for ads. We do not sell your information. We do not use your data to build advertising profiles about you.',
  },
  {
    title: 'Send you notifications',
    body: 'If you turn notifications on, we use your contact information to send updates about session reviews, approvals, photo checkpoints, events, and shop orders. You can change these settings anytime in the app.',
  },
  {
    title: 'Improve the app',
    body: 'We may use anonymous usage information to understand which features are helpful and which need improvement. We do not include your name, photos, or location in this analytics data.',
  },
];

export default function PrivacyHowWeUseItRoute() {
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
      <PrivacyPolicyDetailScreen sectionTitle="How we use it" sections={SECTIONS} />
    </SafeAreaProvider>
  );
}
