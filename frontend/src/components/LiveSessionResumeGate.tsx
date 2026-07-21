import { useRouter } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  bootstrapLiveSessionResumeOffer,
  discardPendingLiveSessionResume,
  evaluateCheckpointMissAndFinalize,
  getPendingLiveSessionResume,
  resumeLiveSessionFromDraft,
  subscribeLiveSession,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { colors, radius, textStyles } from '@/features/session-tracking/tokens';

function usePendingLiveSessionResume() {
  return useSyncExternalStore(
    subscribeLiveSession,
    getPendingLiveSessionResume,
    getPendingLiveSessionResume,
  );
}

/** Prompts to resume an in-progress cleanup session after process death. */
export function LiveSessionResumeGate() {
  const router = useRouter();
  const { isActive } = useLiveSession();
  const offer = usePendingLiveSessionResume();

  useEffect(() => {
    void bootstrapLiveSessionResumeOffer();
  }, []);

  const visible = !isActive && offer != null;

  const handleResume = () => {
    if (!offer) {
      return;
    }

    void resumeLiveSessionFromDraft(offer.draft).then(() => {
      if (evaluateCheckpointMissAndFinalize()) {
        router.replace('/missed-checkpoint');
        return;
      }
      router.push('/live-session');
    });
  };

  const handleDiscard = () => {
    void discardPendingLiveSessionResume();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDiscard}>
      <View style={styles.scrim}>
        <SafeAreaView style={styles.cardWrap} edges={['bottom']}>
          <View style={styles.card}>
            <Text style={[textStyles.headlineDetail, styles.title]}>Resume cleanup session?</Text>
            <Text style={[textStyles.bodySmall, styles.body]}>
              You have an active session from about {offer?.elapsedLabel ?? 'earlier'}
              {offer && offer.checkpointCount > 0
                ? ` with ${offer.checkpointCount} checkpoint photo${offer.checkpointCount === 1 ? '' : 's'}.`
                : '.'}
            </Text>
            <View style={styles.actions}>
              <AnimatedPressable
                style={styles.secondaryBtn}
                onPress={handleDiscard}
                accessibilityRole="button"
                accessibilityLabel="Discard session"
              >
                <Text style={styles.secondaryBtnText}>Discard</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.primaryBtn}
                onPress={handleResume}
                accessibilityRole="button"
                accessibilityLabel="Resume session"
              >
                <Text style={styles.primaryBtnText}>Resume</Text>
              </AnimatedPressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: 20,
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
  },
  body: {
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...textStyles.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
