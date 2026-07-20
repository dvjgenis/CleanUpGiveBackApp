import { Image as ExpoImage, type ImageSource } from 'expo-image';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { CloseIcon } from '@/features/session-tracking/components/icons/CloseIcon';

const CHEVRON_RIGHT = require('@/assets/figma/account/chevron-right.svg');

const C = {
  overlay: '#000000',
  textOnDark: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.72)',
  chromeScrim: 'rgba(0, 0, 0, 0.45)',
} as const;

type Props = {
  visible: boolean;
  /** Remote / file URI — used when `source` is omitted. */
  uri?: string | null;
  /** Prefer this when available (session detail thumbs use the same source). */
  source?: ImageSource | { uri: string } | null;
  /**
   * Optional a11y label only (e.g. "Selfie" / "Progress") — not shown in chrome.
   */
  caption?: string;
  /** Date line (e.g. "July 20, 2026"). */
  dateLabel?: string;
  /** Time line (e.g. "2:30 PM"). */
  timeLabel?: string;
  /** Position counter, e.g. "1/2". */
  counterLabel?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

/** Full-screen photo viewer for session detail and live checkpoint thumbs. */
export function PhotoEnlargeModal({
  visible,
  uri = null,
  source = null,
  caption,
  dateLabel,
  timeLabel,
  counterLabel,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: Props) {
  const timestampLine = [dateLabel, timeLabel].filter(Boolean).join(' · ');
  const imageSource: ImageSource | { uri: string } | null =
    source ?? (uri ? { uri } : null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Modal hosts a separate native window — re-seed safe-area so chrome clears status bar / home indicator. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <View style={s.root}>
          {visible ? <StatusBar style="light" /> : null}

          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close enlarged photo"
          />

          {imageSource ? (
            <View style={s.fullScreenImage} pointerEvents="none">
              <ExpoImage
                source={imageSource}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
                accessibilityLabel={caption ?? 'Enlarged session photo'}
              />
            </View>
          ) : null}

          <SafeAreaView style={s.chrome} pointerEvents="box-none" edges={['top', 'bottom']}>
            <View style={s.topRow} pointerEvents="box-none">
              {timestampLine ? (
                <View style={[s.tag, s.chromeScrim]} pointerEvents="none">
                  <Text style={s.tagText} numberOfLines={1}>
                    {timestampLine}
                  </Text>
                </View>
              ) : (
                <View style={s.topSpacer} />
              )}
              <AnimatedPressable
                style={[s.roundBtn, s.chromeScrim]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close photo viewer"
              >
                <CloseIcon color={C.textOnDark} size={22} />
              </AnimatedPressable>
            </View>

            <View style={s.navRow} pointerEvents="box-none">
              <AnimatedPressable
                style={[s.roundBtn, s.chromeScrim, !hasPrevious && s.roundBtnHidden]}
                onPress={onPrevious}
                disabled={!hasPrevious}
                accessibilityRole="button"
                accessibilityLabel="Previous photo"
              >
                <ExpoImage
                  source={CHEVRON_RIGHT}
                  style={[s.chevron, s.chevronLeft]}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
              </AnimatedPressable>

              <AnimatedPressable
                style={[s.roundBtn, s.chromeScrim, !hasNext && s.roundBtnHidden]}
                onPress={onNext}
                disabled={!hasNext}
                accessibilityRole="button"
                accessibilityLabel="Next photo"
              >
                <ExpoImage
                  source={CHEVRON_RIGHT}
                  style={s.chevron}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
              </AnimatedPressable>
            </View>

            <View style={s.bottomStack} pointerEvents="none">
              {counterLabel ? (
                <View style={[s.tag, s.chromeScrim]}>
                  <Text style={s.counterText} accessibilityLabel={`Photo ${counterLabel}`}>
                    {counterLabel}
                  </Text>
                </View>
              ) : null}
              <Text style={s.hint}>Tap photo to close</Text>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.overlay,
  },

  fullScreenImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  chrome: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  chromeScrim: {
    backgroundColor: C.chromeScrim,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },

  topSpacer: {
    flex: 1,
  },

  tag: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },

  tagText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textOnDark,
  },

  counterText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
    color: C.textOnDark,
    textAlign: 'center',
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roundBtnHidden: {
    opacity: 0,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    flex: 1,
  },

  chevron: {
    width: 28,
    height: 28,
    tintColor: C.textOnDark,
  },

  chevronLeft: {
    transform: [{ scaleX: -1 }],
  },

  bottomStack: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  hint: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
});
