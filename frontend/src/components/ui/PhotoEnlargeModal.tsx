import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { ChevronLeftIcon } from '@/features/session-tracking/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/features/session-tracking/components/icons/ChevronRightIcon';
import { CloseIcon } from '@/features/session-tracking/components/icons/CloseIcon';

const C = {
  overlay: 'rgba(0, 0, 0, 0.92)',
  textOnDark: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.72)',
} as const;

type Props = {
  visible: boolean;
  uri: string | null;
  caption?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

/** Full-screen photo viewer for session detail and other read-only galleries. */
export function PhotoEnlargeModal({
  visible,
  uri,
  caption,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: Props) {
  const { width, height } = useWindowDimensions();
  const imageMaxHeight = height * 0.72;
  const imageMaxWidth = width - 48;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={s.root}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close enlarged photo"
        />

        <SafeAreaView style={s.safeArea} pointerEvents="box-none">
          <View style={s.header}>
            <Text style={s.caption} numberOfLines={2}>
              {caption ?? 'Photo'}
            </Text>
            <AnimatedPressable
              style={s.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
            >
              <CloseIcon color={C.textOnDark} size={24} />
            </AnimatedPressable>
          </View>

          <View style={s.imageRow}>
            <AnimatedPressable
              style={[s.navBtn, !hasPrevious && s.navBtnHidden]}
              onPress={onPrevious}
              disabled={!hasPrevious}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
            >
              <ChevronLeftIcon color={C.textOnDark} size={28} />
            </AnimatedPressable>

            <View style={[s.imageFrame, { maxWidth: imageMaxWidth, maxHeight: imageMaxHeight }]}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={s.image}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={caption ?? 'Enlarged session photo'}
                />
              ) : null}
            </View>

            <AnimatedPressable
              style={[s.navBtn, !hasNext && s.navBtnHidden]}
              onPress={onNext}
              disabled={!hasNext}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
            >
              <ChevronRightIcon color={C.textOnDark} size={28} />
            </AnimatedPressable>
          </View>

          <Text style={s.hint}>Tap outside the photo to close</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.overlay,
  },

  safeArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },

  caption: {
    flex: 1,
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnDark,
  },

  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },

  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBtnHidden: {
    opacity: 0,
  },

  imageFrame: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  hint: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
});
