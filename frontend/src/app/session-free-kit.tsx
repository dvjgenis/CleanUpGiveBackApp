import { FreeKitScreen } from '@/screens/FreeKitScreen';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeKitRoute() {
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <FreeKitScreen
        totalPills={10}
        activePills={7}
        onContinue={() => router.push('/session-setup-step6')}
        onPrevious={() => goBackInSessionSetupGuide(router)}
        onSkip={() => router.push('/session-setup-step6')}
      />
    </SafeAreaProvider>
  );
}
