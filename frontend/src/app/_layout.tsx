import { Stack } from 'expo-router';

const guideBackwardScreenOptions = {
  animationTypeForReplace: 'pop' as const,
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="session-setup-guide" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup" />
      <Stack.Screen name="session-setup-step2" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step3" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step4" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step5" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-step6" />
      <Stack.Screen name="session-setup-step7" options={guideBackwardScreenOptions} />
      <Stack.Screen name="session-setup-complete" options={guideBackwardScreenOptions} />
      <Stack.Screen name="live-session" options={{ animation: 'none' }} />
      <Stack.Screen name="photo-checkpoint" />
      <Stack.Screen name="photo-capture" />
      <Stack.Screen name="photo-submitted" />
      <Stack.Screen name="submission-confirmation" />
      <Stack.Screen name="missed-checkpoint" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="prototype/[screen]" />
    </Stack>
  );
}
