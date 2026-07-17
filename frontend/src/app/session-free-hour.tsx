import { FreeHourScreen } from '@/screens/FreeHourScreen';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeHourRoute() {
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <FreeHourScreen
        totalPills={7}
        activePills={6}
        onContinue={() => router.push('/session-free-kit')}
        onPrevious={() => goBackInSessionSetupGuide(router)}
        onSkip={() => router.push('/session-setup-complete')}
      />
    </SafeAreaProvider>
  );
}
