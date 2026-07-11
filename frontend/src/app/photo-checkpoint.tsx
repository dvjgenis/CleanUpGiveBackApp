import { PhotoCheckpointScreen } from '@/screens/PhotoCheckpointScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function PhotoCheckpointRoute() {
  return (
    <SafeAreaProvider>
      <PhotoCheckpointScreen />
    </SafeAreaProvider>
  );
}
