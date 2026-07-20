import { FreeKitScreen } from '@/screens/FreeKitScreen';
import {
  exitSessionSetupGuideToTrackEntry,
  goBackInSessionSetupGuide,
  useSessionSetupGuidePillProgress,
} from '@/utils/sessionSetupGuideNavigation';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SessionFreeKitRoute() {
  const router = useRouter();
  const { total, active } = useSessionSetupGuidePillProgress('free-kit');

  return (
    <SafeAreaProvider>
      <FreeKitScreen
        totalPills={total}
        activePills={active}
        onContinue={() => router.push('/session-setup-step6')}
        onPrevious={() => goBackInSessionSetupGuide(router)}
        onSkip={() => router.push('/session-setup-step6')}
        onBack={() => exitSessionSetupGuideToTrackEntry(router)}
      />
    </SafeAreaProvider>
  );
}
