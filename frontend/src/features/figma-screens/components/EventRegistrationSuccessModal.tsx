import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';

import { EventSuccessCheckIcon } from './EventIcons';
import { colors, fontFamilies, radius } from '../tokens';

type Props = {
  visible: boolean;
  onGoHome: () => void;
};

/**
 * Registration confirmation overlay (Figma `events_registration_confirmation`, `787:406`).
 */
export function EventRegistrationSuccessModal({ visible, onGoHome }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onGoHome}>
      <RegistrationSuccessContent onGoHome={onGoHome} />
    </Modal>
  );
}

function RegistrationSuccessContent({ onGoHome }: { onGoHome: () => void }) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.cardInner}>
          <View style={s.messageBlock}>
            <EventSuccessCheckIcon width={79} height={79} />
            <Text style={s.message} accessibilityRole="header">
              You have successfully registered for this event!
            </Text>
          </View>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.goHomeBtn}
            onPress={onGoHome}
            accessibilityRole="button"
            accessibilityLabel="Go Home"
          >
            <Text style={s.goHomeLabel}>Go Home</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 27, 27, 0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 359,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  cardInner: {
    gap: 15,
    alignItems: 'center',
  },
  messageBlock: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  message: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  goHomeBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goHomeLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
