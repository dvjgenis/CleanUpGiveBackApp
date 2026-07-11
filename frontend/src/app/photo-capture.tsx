import { PhotoCaptureScreen } from '@/screens/PhotoCaptureScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function PhotoCaptureRoute() {
  return (
    <SafeAreaProvider>
      <PhotoCaptureScreen />
    </SafeAreaProvider>
  );
}
