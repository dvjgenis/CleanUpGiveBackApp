import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAttentionShake } from '@/components/motion/hooks';
import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import { WarningTriangleIcon } from '../components/AccountIcons';
import { colors, fontFamilies, radius } from '../tokens';

const BOTTOM_NAV_HEIGHT = 64;
const CONFIRM_WORD = 'DELETE';

function ValidationToastAlert({ message }: { message: string }) {
  const shakeStyle = useAttentionShake();

  return (
    <Animated.View
      style={[s.validationToast, shakeStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.validationToastTitle}>Confirmation required</Text>
      <Text style={s.validationToastLine}>
        {'\u2022  '}
        {message}
      </Text>
    </Animated.View>
  );
}

/**
 * Delete account confirmation (Figma `delete_account`, node `725:361` / PRD §6.35).
 * Requires typing DELETE before confirming; otherwise shows a session-setup-style toast.
 */
export function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();
  const [confirmText, setConfirmText] = useState('');
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [inputHasError, setInputHasError] = useState(false);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + BOTTOM_NAV_HEIGHT + 32;

  function handleConfirmDelete() {
    const isConfirmed = confirmText.trim() === CONFIRM_WORD;

    if (!isConfirmed) {
      setToastKey((key) => key + 1);
      setShowValidationToast(true);
      setInputHasError(true);
      return;
    }

    setShowValidationToast(false);
    setInputHasError(false);
    // Welcome / auth wipe not implemented yet — return to home after confirm.
    router.replace('/');
  }

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionSetupTopAppBar title="Account" onBack={() => router.back()} />
        {showValidationToast ? (
          <ValidationToastAlert key={toastKey} message={`Type ${CONFIRM_WORD} to confirm`} />
        ) : null}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.contentStack}>
          <View style={s.deleteSection}>
            <View style={s.copyBlock}>
              <Text style={s.headline}>Delete your account?</Text>
              <Text style={s.body}>
                This permanently deletes your profile, sessions, and photos. Court-ordered logs may be
                retained as required by law.
              </Text>
            </View>

            <View style={s.warningBanner}>
              <WarningTriangleIcon width={16} height={16} />
              <Text style={s.warningText}>This action cannot be undone</Text>
            </View>
          </View>

          <View style={s.confirmBlock}>
            <Text style={s.confirmHint}>
              <Text style={s.confirmHintMuted}>To confirm this action, type </Text>
              <Text style={s.confirmHintEmphasis}>{CONFIRM_WORD} </Text>
              <Text style={s.confirmHintMuted}>below.</Text>
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={(next) => {
                setConfirmText(next);
                if (showValidationToast || inputHasError) {
                  setShowValidationToast(false);
                  setInputHasError(false);
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={`Type ${CONFIRM_WORD} to confirm account deletion`}
              style={[s.input, inputHasError ? s.inputError : null]}
            />
          </View>
        </View>

        <AnimatedPressable
          scaleTo={0.98}
          onPress={handleConfirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
          style={s.deleteBtn}
        >
          <Text style={s.deleteBtnLabel}>Delete my account</Text>
        </AnimatedPressable>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => {}}
          onProfilePress={() => router.replace('/account' as Href)}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topSection: {
    zIndex: 10,
    backgroundColor: colors.bgApp,
  },
  validationToast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.statusDeclinedBg,
    borderWidth: 1,
    borderColor: colors.statusDeclinedText,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  validationToastTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
    marginBottom: 2,
  },
  validationToastLine: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 32,
  },
  contentStack: {
    gap: 30,
  },
  deleteSection: {
    gap: 20,
  },
  copyBlock: {
    gap: 19,
  },
  headline: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.statusDeclinedText,
  },
  body: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  warningBanner: {
    minHeight: 53,
    backgroundColor: colors.statusPendingBg,
    borderWidth: 1,
    borderColor: colors.statusPendingBorder,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  warningText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.statusPendingText,
  },
  confirmBlock: {
    gap: 11,
  },
  confirmHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
  },
  confirmHintMuted: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.copyright,
  },
  confirmHintEmphasis: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textPrimary,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.statusDeclinedText,
  },
  deleteBtn: {
    height: 56,
    backgroundColor: colors.statusDeclinedText,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
