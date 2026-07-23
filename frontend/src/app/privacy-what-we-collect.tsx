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
    body: 'When you use Clean Up - Give Back, we collect information about you. This includes details that identify you, like your name and email. It also includes information linked to your account and your cleanup sessions. This page explains what we collect, when we collect it, and where it comes from.',
  },
  {
    title: 'Information you give us',
    body: 'When you create an account, you give us your name, email address, password, phone number, and street address. You may also tell us whether your community service is court-ordered. When you finish a cleanup session, you take photos in the app. These can include a selfie and a photo of your filled trash bag. We use these photos to confirm you completed the work. We do not use your photos for advertising.',
  },
  {
    title: 'Information from active sessions',
    body: 'While you are tracking a cleanup session, we collect your location using GPS. GPS means your phone shares your position on a map. This helps us see where you cleaned and how long you worked. We also save when the session started and when it ended. We only collect location during an active session. We do not track you in the background when you are not tracking. You will always see a clear sign on screen when location is being recorded.',
  },
  {
    title: 'Information for support',
    body: 'We may collect your phone type, operating system, and app version. We also collect basic error logs if the app crashes. This helps us fix problems, answer your questions, and improve the app over time.',
  },
  {
    title: 'Payment information',
    body: 'When you buy from the shop or make a donation, Stripe processes your payment. Stripe is a secure payment company. We receive a confirmation that payment was made. We do not store your full card number on our servers.',
  },
  {
    title: 'What we do not do',
    body: 'We do not sell your information. We do not use your data for targeted ads on other apps and websites. We do not collect more data than we need to run the app and verify your cleanup work.',
  },
  {
    title: 'Children and teens',
    body: "If you are under 13, you cannot use the app. If you enter an age under 13 during signup, we delete the information you entered and do not keep it. If you are 13 or older, your account uses the same high privacy settings as everyone else. We do not use dark patterns or nudges to get you to share more data than you need to.",
  },
  {
    title: 'How long we keep your data',
    body: 'We keep your information only as long as we need it to run the app, verify your service hours, and meet legal requirements. Some court-ordered service records may be kept longer if the law requires it. You can ask us to delete your data. Some records may be kept if required by law.',
  },
];

export default function PrivacyWhatWeCollectRoute() {
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
      <PrivacyPolicyDetailScreen sectionTitle="What we collect" sections={SECTIONS} />
    </SafeAreaProvider>
  );
}
