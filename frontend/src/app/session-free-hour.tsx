import { FreeHourScreen } from '@/screens/FreeHourScreen';
import {
  goBackInSessionSetupGuide,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeHourRoute() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('free-hour');

  return (
    <SafeAreaProvider>
      <FreeHourScreen
        totalPills={total}
        activePills={active}
        onContinue={() => router.push('/session-free-kit')}
        onPrevious={() => goBackInSessionSetupGuide(router)}
        onSkip={() => router.push('/session-setup-step6')}
      />
    </SafeAreaProvider>
  );
}
