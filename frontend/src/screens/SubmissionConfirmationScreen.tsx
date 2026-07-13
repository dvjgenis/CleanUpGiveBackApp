import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';
import { PhotoEnlargeModal } from '@/components/ui/PhotoEnlargeModal';

import { CheckCircleIcon } from '@/features/session-tracking/components/icons/CheckCircleIcon';
import { ChevronLeftIcon } from '@/features/session-tracking/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/features/session-tracking/components/icons/ChevronRightIcon';
import { SessionRouteMapPreview } from '@/features/session-tracking/components/SessionRouteMapPreview';
import { getCompletedSessionSnapshot } from '@/features/session-tracking/liveSessionStore';
import {
  formatDurationParts,
  formatPhotoTimeLabel,
  formatSessionDateLabel,
  formatSessionTimeRange,
  getCheckpointLabel,
} from '@/features/session-tracking/utils/sessionFormat';

import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  bgSurface: tokens.chipBg,
  bgSurfaceWhite: tokens.white,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
  borderOutline: tokens.borderOutline,
  mapTint: '#eae3d0',
  statusPendingBg: tokens.statusPendingBorder,
  statusPendingText: tokens.statusPendingText,
  statusPendingDot: tokens.statusPendingText,
  approvalIcon: tokens.statusPendingText,
} as const;

const PHOTO_SIZE = 171;
const PHOTO_GAP = 16;
const FOOTER_HEIGHT = 168;

type Checkpoint = {
  time: string;
  label: string;
  isLast?: boolean;
};

type SessionPhoto = {
  uri: string;
  timeLabel: string;
  key: string;
  label: string;
};

function ApprovalIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16V22H20V16C20 14.9 19.1 14 18 14H6C4.9 14 4 14.9 4 16ZM18 18H6V16H18V18ZM12 2C9.24 2 7 4.24 7 7L12 14L17 7C17 4.24 14.76 2 12 2ZM12 11L9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7L12 11Z"
        fill={C.approvalIcon}
      />
    </Svg>
  );
}

function DotSeparator() {
  return <Circle cx={2} cy={2} r={2} fill={C.textTertiary} />;
}

function InlineDot() {
  return (
    <Svg width={4} height={4} viewBox="0 0 4 4" fill="none">
      <DotSeparator />
    </Svg>
  );
}

function CheckpointTimelineItem({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <View style={s.checkpointRow}>
      <View style={s.checkpointIconCol}>
        {!checkpoint.isLast ? (
          <View style={s.checkpointIconStack}>
            <CheckCircleIcon color={C.primary} size={24} />
            <View style={s.checkpointConnector} />
          </View>
        ) : (
          <CheckCircleIcon color={C.primary} size={24} />
        )}
      </View>
      <View style={s.checkpointCopy}>
        <View style={s.checkpointMetaRow}>
          <Text style={s.checkpointTime}>{checkpoint.time}</Text>
          <InlineDot />
          <Text style={s.checkpointLabel}>{checkpoint.label}</Text>
        </View>
        <Text style={s.checkpointStatus}>Submitted</Text>
      </View>
    </View>
  );
}

/** PRD §6.15 · Figma `submission_confirmation___prd_aligned` (269:1615). */
export function SubmissionConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const photoScrollRef = useRef<ScrollView>(null);
  const [photoScrollX, setPhotoScrollX] = useState(0);
  const [photoViewportWidth, setPhotoViewportWidth] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const headerStyle = useFadeUpEnter(0);
  const mapStyle = useFadeUpEnter(staggerDelay(1));
  const photosStyle = useFadeUpEnter(staggerDelay(2));
  const timelineStyle = useFadeUpEnter(staggerDelay(3));
  const footerStyle = useFadeUpEnter(staggerDelay(4));
  const session = useMemo(() => getCompletedSessionSnapshot(), []);

  const sessionPhotos: SessionPhoto[] = useMemo(
    () =>
      (session?.submittedCheckpoints ?? []).flatMap((checkpoint) => [
        {
          key: `${checkpoint.id}-selfie`,
          uri: checkpoint.selfieUri,
          timeLabel: formatPhotoTimeLabel(checkpoint.capturedAt),
          label: 'Selfie',
        },
        {
          key: `${checkpoint.id}-progress`,
          uri: checkpoint.progressUri,
          timeLabel: formatPhotoTimeLabel(checkpoint.capturedAt),
          label: 'Progress',
        },
      ]),
    [session],
  );

  const checkpoints: Checkpoint[] = useMemo(() => {
    const submissions = session?.submittedCheckpoints ?? [];
    return submissions.map((checkpoint, index) => ({
      time: formatPhotoTimeLabel(checkpoint.capturedAt),
      label: getCheckpointLabel(index, submissions.length),
      isLast: index === submissions.length - 1,
    }));
  }, [session]);

  const duration = formatDurationParts(session?.elapsedSeconds ?? 0);
  const sessionTitle = session?.setup.activity ?? 'Cleanup Session';
  const sessionDateLabel = session
    ? formatSessionDateLabel(session.startedAt)
    : '—';
  const sessionTimeRange = session
    ? formatSessionTimeRange(session.startedAt, session.endedAt)
    : '—';
  const sessionDescription =
    session?.setup.description?.trim() || 'No description provided for this session.';
  const courtOrderedValue = session?.setup.courtOrdered ? 'Yes' : 'No';
  const routeCoordinates = session?.routeCoordinates ?? [];

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    IBMPlexSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  const photoStride = PHOTO_SIZE + PHOTO_GAP;
  const maxPhotoScrollX = Math.max(0, sessionPhotos.length * photoStride - photoViewportWidth);
  const canScrollPhotosLeft = photoScrollX > 4;
  const canScrollPhotosRight = photoScrollX < maxPhotoScrollX - 4;

  const scrollPhotos = (direction: 'left' | 'right') => {
    const nextX =
      direction === 'left'
        ? Math.max(0, photoScrollX - photoStride)
        : Math.min(maxPhotoScrollX, photoScrollX + photoStride);
    photoScrollRef.current?.scrollTo({ x: nextX, animated: true });
    setPhotoScrollX(nextX);
  };

  const onPhotoScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPhotoScrollX(event.nativeEvent.contentOffset.x);
  };

  const selectedPhoto =
    selectedPhotoIndex !== null ? sessionPhotos[selectedPhotoIndex] ?? null : null;

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.topSafeArea}>
        <View style={s.topBar}>
          <Text style={s.topBarTitle} accessibilityRole="header">
            Session Detail
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: FOOTER_HEIGHT + insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headerStyle}>
        <View style={s.detailsBlock}>
          <View style={s.titleBlock}>
            <View style={s.statusPill}>
              <View style={s.statusDot} />
              <Text style={s.statusPillText}>Under Review</Text>
            </View>
            <Text style={s.sessionTitle}>{sessionTitle}</Text>
          </View>

          <View style={s.metaBlock}>
            <View style={s.metaField}>
              <Text style={s.metaLabel}>DURATION</Text>
              <View style={s.durationRow}>
                {duration.hours > 0 ? (
                  <Text style={s.durationValue}>{duration.hours}h</Text>
                ) : null}
                <Text style={s.durationValue}>{duration.minutes}m</Text>
              </View>
            </View>

            <View style={s.metaFieldWide}>
              <Text style={s.metaLabel}>DATE & TIME</Text>
              <View style={s.dateTimeRow}>
                <Text style={s.dateTimeText}>{sessionDateLabel}</Text>
                <InlineDot />
                <Text style={s.dateTimeText}>{sessionTimeRange}</Text>
              </View>
            </View>
          </View>
        </View>
        </Animated.View>

        <Animated.View style={mapStyle}>
        <View style={s.mapCard} accessibilityLabel="Session route map">
          <SessionRouteMapPreview routeCoordinates={routeCoordinates} style={s.mapPreview} />
        </View>
        </Animated.View>

        <Animated.View style={photosStyle}>
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Photos</Text>
          {sessionPhotos.length > 0 ? (
          <View
            style={s.photosSection}
            onLayout={(event) => setPhotoViewportWidth(event.nativeEvent.layout.width)}
          >
          <ScrollView
            ref={photoScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.photosRow}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={photoStride}
          >
            {sessionPhotos.map((photo, index) => (
              <AnimatedPressable
                key={photo.key}
                style={s.photoCard}
                scaleTo={0.98}
                onPress={() => setSelectedPhotoIndex(index)}
                accessibilityRole="button"
                accessibilityLabel={`View enlarged ${photo.label.toLowerCase()} photo at ${photo.timeLabel}`}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={s.photoImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={s.photoTimePill}>
                  <Text style={s.photoTimeText}>{photo.timeLabel}</Text>
                </View>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <View style={s.photoNavRow} pointerEvents="box-none">
            <AnimatedPressable
              style={[s.photoNavBtn, !canScrollPhotosLeft && s.photoNavBtnHidden]}
              scaleTo={0.98}
              onPress={() => scrollPhotos('left')}
              disabled={!canScrollPhotosLeft}
              accessibilityRole="button"
              accessibilityLabel="Scroll photos left"
            >
              <ChevronLeftIcon color={C.textTertiary} size={24} />
            </AnimatedPressable>
            <AnimatedPressable
              style={[s.photoNavBtn, s.photoNavBtnRight, !canScrollPhotosRight && s.photoNavBtnHidden]}
              scaleTo={0.98}
              onPress={() => scrollPhotos('right')}
              disabled={!canScrollPhotosRight}
              accessibilityRole="button"
              accessibilityLabel="Scroll photos right"
            >
              <ChevronRightIcon color={C.textTertiary} size={24} />
            </AnimatedPressable>
          </View>
        </View>
          ) : (
            <Text style={s.emptyPhotosText}>No checkpoint photos were submitted for this session.</Text>
          )}
        </View>
        </Animated.View>

        <Animated.View style={[s.timelineBlock, timelineStyle]}>
        {checkpoints.length > 0 ? (
        <View style={s.checkpointsCard}>
          <Text style={s.sectionTitleCompact}>Photo Checkpoints</Text>
          <View style={s.checkpointsList}>
            {checkpoints.map((checkpoint) => (
              <CheckpointTimelineItem key={`${checkpoint.time}-${checkpoint.label}`} checkpoint={checkpoint} />
            ))}
          </View>
        </View>
        ) : null}

        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Description</Text>
          <Text style={s.descriptionText}>{sessionDescription}</Text>
        </View>

        <View style={s.courtOrderedRow}>
          <Text style={s.courtOrderedLabel}>Court Ordered Status</Text>
          <Text style={s.courtOrderedValue}>{courtOrderedValue}</Text>
        </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[s.footer, { paddingBottom: 12 + insets.bottom }, footerStyle]}>
        <View style={s.footerContent}>
          <View style={s.footerMessageBlock}>
            <ApprovalIcon />
            <Text style={s.footerMessage}>
              Your session has been submitted{'\n'}for manual approval. You will be notified
              in-app and email once approved.
            </Text>
          </View>

          <View style={s.goHomeBtnWrap}>
            <AnimatedPressable
              style={s.goHomeBtn}
              scaleTo={0.98}
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Go home"
            >
              <Text style={s.goHomeBtnText}>Go Home</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Animated.View>

      <PhotoEnlargeModal
        visible={selectedPhotoIndex !== null}
        uri={selectedPhoto?.uri ?? null}
        caption={
          selectedPhoto ? `${selectedPhoto.label} · ${selectedPhoto.timeLabel}` : undefined
        }
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrevious={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={
          selectedPhotoIndex !== null && selectedPhotoIndex < sessionPhotos.length - 1
        }
        onPrevious={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index > 0 ? index - 1 : index,
          )
        }
        onNext={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index < sessionPhotos.length - 1 ? index + 1 : index,
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgApp,
  },

  topSafeArea: {
    backgroundColor: C.bgSurfaceWhite,
  },

  topBar: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: C.bgSurfaceWhite,
  },

  topBarTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    color: C.textPrimary,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: FOOTER_HEIGHT + 24,
    gap: 24,
  },

  detailsBlock: {
    gap: 15,
  },

  titleBlock: {
    gap: 15,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: C.statusPendingBg,
    borderColor: C.statusPendingBg,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.statusPendingDot,
  },

  statusPillText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: C.statusPendingText,
  },

  sessionTitle: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
  },

  metaBlock: {
    gap: 20,
  },

  metaField: {
    gap: 5,
  },

  metaFieldWide: {
    gap: 5,
    width: '100%',
  },

  metaLabel: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 12,
    color: C.textTertiary,
    letterSpacing: 0.5,
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  durationValue: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 24,
    color: C.primary,
  },

  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateTimeText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: C.textTertiary,
  },

  mapCard: {
    height: 194,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderOutline,
    backgroundColor: C.bgSurfaceWhite,
    overflow: 'hidden',
  },

  mapPreview: {
    flex: 1,
  },

  emptyPhotosText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textTertiary,
    includeFontPadding: false,
  },

  sectionBlock: {
    gap: 0,
  },

  sectionHeading: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: C.textPrimary,
    marginBottom: 6,
  },

  sectionTitleCompact: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: C.textPrimary,
  },

  timelineBlock: {
    gap: 16,
  },

  photosSection: {
    gap: 12,
  },

  photosRow: {
    gap: PHOTO_GAP,
    paddingRight: 16,
  },

  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderOutline,
    overflow: 'hidden',
  },

  photoImage: {
    width: '100%',
    height: '100%',
  },

  photoTimePill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: C.borderOutline,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: C.borderOutline,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  photoTimeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 10,
    color: C.textTertiary,
  },

  photoNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  photoNavBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoNavBtnRight: {
    marginLeft: 'auto',
  },

  photoNavBtnHidden: {
    opacity: 0.35,
  },

  checkpointsCard: {
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 16,
    backgroundColor: C.bgSurfaceWhite,
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },

  checkpointsList: {
    gap: 10,
  },

  checkpointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  checkpointIconCol: {
    width: 24,
    alignItems: 'center',
  },

  checkpointIconStack: {
    alignItems: 'center',
  },

  checkpointConnector: {
    width: 2,
    height: 24,
    backgroundColor: C.borderOutline,
    marginTop: 2,
  },

  checkpointCopy: {
    flex: 1,
    gap: 2,
  },

  checkpointMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  checkpointTime: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: C.textTertiary,
  },

  checkpointLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: C.textTertiary,
  },

  checkpointStatus: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: C.textTertiary,
  },

  descriptionText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textTertiary,
    includeFontPadding: false,
  },

  courtOrderedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 53,
  },

  courtOrderedLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },

  courtOrderedValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: C.textTertiary,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bgApp,
    borderTopWidth: 1,
    borderTopColor: C.borderOutline,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  footerContent: {
    width: '100%',
    gap: 18,
    alignItems: 'center',
  },

  footerMessageBlock: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 310,
  },

  footerMessage: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
    textAlign: 'center',
  },

  goHomeBtnWrap: {
    width: '100%',
  },

  goHomeBtn: {
    width: '100%',
    minHeight: 54,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    overflow: 'hidden',
  },

  goHomeBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
    textAlign: 'center',
  },
});
