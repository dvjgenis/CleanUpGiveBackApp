import { Image, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const version = Constants.expoConfig?.version ?? '0.0.1';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F5E9', dark: '#1B4332' }}
      headerImage={
        <View style={styles.headerImageWrap}>
          <Image source={require('@/assets/images/icon.png')} style={styles.headerLogo} />
        </View>
      }>
      <ThemedView style={styles.titleBlock}>
        <ThemedText type="title">Clean-Up Give-Back</ThemedText>
        <ThemedText style={styles.versionLabel}>Version {version}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Service tracking, simplified</ThemedText>
        <ThemedText>
          This app is for volunteers and court-ordered participants cleaning up with{' '}
          <ThemedText type="defaultSemiBold">Clean Up - Give Back</ThemedText> in Des Plaines,
          IL. Upcoming releases will add sign-in, verified sessions, and hour logs you can share
          with school, work, or court.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Where things stand</ThemedText>
        <ThemedText>
          You’re viewing the early shell. In development, a second tab —{' '}
          <ThemedText type="defaultSemiBold">Developer</ThemedText> — has notes from the Expo
          starter; it is omitted from release builds. Product flows (map, timer, photos,
          admin review) are not built yet—see{' '}
          <ThemedText type="defaultSemiBold">Current.md</ThemedText> in the repo for a full
          checklist.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImageWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  headerLogo: {
    width: 120,
    height: 120,
    borderRadius: 26,
  },
  titleBlock: {
    gap: 6,
    marginBottom: 4,
  },
  versionLabel: {
    opacity: 0.7,
    fontSize: 14,
  },
  section: {
    gap: 10,
    marginBottom: 8,
  },
});
