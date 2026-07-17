import { FreeKitScreen } from '@/screens/FreeKitScreen';
import { goBackInSessionSetupGuide } from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeKitRoute() {
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <FreeKitScreen
        totalPills={7}
        activePills={7}
        onContinue={() => router.push('/session-setup-complete')}
        onPrevious={() => goBackInSessionSetupGuide(router)}
        onSkip={() => router.push('/session-setup-complete')}
      />
    </SafeAreaProvider>
  );
}
