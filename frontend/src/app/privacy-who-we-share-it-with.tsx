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
    body: 'We only share your information with companies that help us run the app. We share only what they need to do their job. We do not sell your information to data brokers or advertisers.',
  },
  {
    title: 'Supabase',
    body: 'Supabase stores your account profile, session history, photos, and location data from active sessions. They provide secure cloud storage and help us keep the app running.',
  },
  {
    title: 'Google Maps',
    body: 'Google Maps shows your route on the map while you track a cleanup session. Location data is shared with Google only during active sessions when the map is in use.',
  },
  {
    title: 'Stripe',
    body: 'Stripe processes shop purchases and donations. Stripe receives payment details needed to complete the transaction. We do not store your full card number on our servers.',
  },
  {
    title: 'We do not sell your data',
    body: 'We do not sell your information. We do not use your data for targeted ads on other apps and websites. We do not share your data with companies that want to market to you.',
  },
  {
    title: 'When the law requires it',
    body: "We may share information if the law requires it. For example, we may respond to a court order, subpoena, or government request. We may also share information to protect someone's safety or to investigate fraud or abuse.",
  },
  {
    title: 'What we never share',
    body: 'We do not sell your information. We do not share your photos or session location with advertisers. We do not share your data so other companies can market to you on other apps or websites.',
  },
  {
    title: 'Service providers only',
    body: 'Our partners act as service providers. They may only use your information to help us run Clean Up - Give Back. They must protect your data and follow our instructions.',
  },
];

export default function PrivacyWhoWeShareRoute() {
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
      <PrivacyPolicyDetailScreen sectionTitle="Who we share it with" sections={SECTIONS} />
    </SafeAreaProvider>
  );
}
