import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useModalCardEnter } from '@/components/motion/hooks';

import { EventSuccessCheckIcon } from './EventIcons';
import { colors, fontFamilies, radius } from '../tokens';

type ConfirmProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirm redeeming a company upgrade code. */
export function CompanyCodeConfirmModal({ visible, onConfirm, onCancel }: ConfirmProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <CompanyCodeConfirmContent onConfirm={onConfirm} onCancel={onCancel} />
    </Modal>
  );
}

function CompanyCodeConfirmContent({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.inner}>
          <Text style={s.title} accessibilityRole="header">
            Redeem company code?
          </Text>
          <Text style={s.body}>
            Redeem this company code and upgrade your account? The one-hour tracking limit will be
            removed.
          </Text>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.primaryBtn}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm upgrade"
          >
            <Text style={s.primaryLabel}>Upgrade account</Text>
          </AnimatedPressable>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.secondaryBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.secondaryLabel}>Cancel</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

type SuccessProps = {
  visible: boolean;
  onDone: () => void;
};

/** Success after company code upgrades the account. */
export function CompanyCodeUpgradeSuccessModal({ visible, onDone }: SuccessProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDone}>
      <CompanyCodeUpgradeSuccessContent onDone={onDone} />
    </Modal>
  );
}

function CompanyCodeUpgradeSuccessContent({ onDone }: { onDone: () => void }) {
  const { cardStyle, scrimStyle } = useModalCardEnter();

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} pointerEvents="none" />
      <Animated.View style={[s.card, cardStyle]}>
        <View style={s.inner}>
          <EventSuccessCheckIcon width={79} height={79} />
          <Text style={s.title} accessibilityRole="header">
            Account has been upgraded
          </Text>
          <Text style={s.body}>
            Your one-hour tracking limit has been removed. Enjoy unlimited session tracking.
          </Text>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.primaryBtn}
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={s.primaryLabel}>Done</Text>
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
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 24,
  },
  inner: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 15,
    color: colors.textTertiary,
  },
});
