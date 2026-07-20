import { IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from '@/components/ui/Compass';
import { PhotoEnlargeModal } from '@/components/ui/PhotoEnlargeModal';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { LiveSessionMap } from '@/features/session-tracking/components/LiveSessionMap';
import { MapTypesSheet } from '@/features/session-tracking/components/MapTypesSheet';
import { TrackerActionButton } from '@/features/session-tracking/components/TrackerActionButton';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { TrackerEndSessionIcon } from '@/features/session-tracking/components/icons/TrackerEndSessionIcon';
import { TrackerLayersIcon } from '@/features/session-tracking/components/icons/TrackerLayersIcon';
import { TrackerMapDarkIcon, TrackerMapLightIcon } from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import { RouteIcon } from '@/features/session-tracking/components/icons/RouteIcon';
import { TrackerMyLocationIcon } from '@/features/session-tracking/components/icons/TrackerMyLocationIcon';
import { TrackerSubmitPhotoIcon } from '@/features/session-tracking/components/icons/TrackerSubmitPhotoIcon';
import { TrackerWeatherIcon } from '@/features/session-tracking/components/icons/TrackerWeatherIcon';
import {
  formatElapsed,
  formatCheckpointDue,
} from '@/features/session-tracking/mocks/session';
import type { PhotoCheckpointSubmission } from '@/features/session-tracking/liveSessionStore';
import {
  finalizeLiveSession,
  ensureLocationWatching,
  ensureLiveSessionTicking,
  getCheckpointProgress,
  isCheckpointMissed,
  requestLiveSessionMapRecenter,
  setLiveSessionMapLayer,
  toggleLiveSessionMapFollow,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import {
  toggleManualMapTheme,
  useEffectiveMapTheme,
} from '@/features/session-tracking/mapThemeStore';
import { useLiveWeather } from '@/features/session-tracking/hooks/useLiveWeather';
import { useLiveSessionMapReveal } from '@/features/session-tracking/hooks/useLiveSessionMapReveal';
import {
  getFreeTrialSecondsRemaining,
  getTrackerHasPaid,
  isFreeTrialExpired,
} from '@/features/session-tracking/trackerPaymentStore';
import { colors, radius } from '@/features/session-tracking/tokens';
import {
  formatPhotoTimeLabel,
  formatSessionDateLabel,
  formatSubmittedCheckpointCount,
  shouldShowCheckpointSubmissionCount,
} from '@/features/session-tracking/utils/sessionFormat';

const C = {
  bgApp: colors.bgApp,
  mapTint: '#eae3d0',
  primary: colors.primary,
  accentLime: colors.accentLime,
  textPrimary: colors.textPrimary,
  textTertiary: colors.textTertiary,
  textOnPrimary: colors.textOnPrimary,
  borderOutline: colors.borderOutline,
  statusPending: colors.status.pending.border,
} as const;

const TIMER_BORDER_PULSE_MS = 2400;
const CHECKPOINT_THUMB_SIZE = 44;
const CHECKPOINT_THUMB_OVERLAP = 16;

type CheckpointViewerPhoto = {
  key: string;
  uri: string;
  label: string;
  capturedAt: number;
};

function buildCheckpointViewerPhotos(
  checkpoints: PhotoCheckpointSubmission[],
): CheckpointViewerPhoto[] {
  const photos: CheckpointViewerPhoto[] = [];
  for (const checkpoint of checkpoints) {
    if (checkpoint.selfieUri) {
      photos.push({
        key: `${checkpoint.id}-selfie`,
        uri: checkpoint.selfieUri,
        label: 'Selfie',
        capturedAt: checkpoint.capturedAt,
      });
    }
    if (checkpoint.progressUri) {
      photos.push({
        key: `${checkpoint.id}-progress`,
        uri: checkpoint.progressUri,
        label: 'Progress',
        capturedAt: checkpoint.capturedAt,
      });
    }
  }
  return photos;
}

function formatDistanceMiles(miles: number): string {
  if (miles === 0) {
    return '0';
  }
  return miles.toFixed(1);
}

function PulsingTimerCard({ children }: { children: React.ReactNode }) {
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    borderOpacity.value = withRepeat(
      withTiming(0.4, {
        duration: TIMER_BORDER_PULSE_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [borderOpacity]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(194, 216, 50, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View style={[s.timerCard, borderStyle]}>
      {children}
    </Animated.View>
  );
}

function TrackerBackButton({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable
      style={s.backBtn}
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <View style={s.backBtnIconWrap} pointerEvents="none">
        <SessionSetupBackChevronIcon color={C.textTertiary} width={8.485} height={14.142} />
      </View>
    </AnimatedPressable>
  );
}

function TrackerCompassControl() {
  const { currentHeading } = useLiveSession();

  return (
    <Compass
      size={48}
      borderColor={C.borderOutline}
      backgroundColor={C.textOnPrimary}
      headingDegrees={currentHeading}
    />
  );
}

function MapToolButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <AnimatedPressable
      style={s.mapToolBtn}
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}

/** PRD §6.11 · Figma `session_setup_guide` live tracker (`251:439`). */
export function LiveSessionScreen() {
  const router = useRouter();
  const { elapsedSeconds, checkpointSecondsRemaining, distanceMiles, submittedCheckpoints, mapLayer, mapFollowEnabled } =
    useLiveSession();
  const [mapLayerPickerVisible, setMapLayerPickerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const mapTheme = useEffectiveMapTheme();
  const { mapRevealStyle, chromeStyle } = useLiveSessionMapReveal();
  const submittedCheckpointCount = submittedCheckpoints.length;
  const showSubmissionCount = shouldShowCheckpointSubmissionCount(submittedCheckpoints);
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(submittedCheckpointCount);
  const viewerPhotos = useMemo(
    () => buildCheckpointViewerPhotos(submittedCheckpoints),
    [submittedCheckpoints],
  );
  const selectedPhoto =
    selectedPhotoIndex !== null ? viewerPhotos[selectedPhotoIndex] ?? null : null;
  const { placeLabel, temperatureLabel, isLoading: isWeatherLoading } = useLiveWeather();
  const freeTrialRemaining = getFreeTrialSecondsRemaining(elapsedSeconds);
  const showFreeTrialCountdown = !getTrackerHasPaid();

  const openCheckpointPhotos = (checkpointId: string) => {
    const startIndex = viewerPhotos.findIndex(
      (photo) => photo.key.startsWith(`${checkpointId}-`),
    );
    if (startIndex >= 0) {
      setSelectedPhotoIndex(startIndex);
    }
  };

  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);

  useEffect(() => {
    void ensureLocationWatching();
    ensureLiveSessionTicking();
  }, []);

  useEffect(() => {
    if (checkpointSecondsRemaining === 0) {
      router.push('/photo-checkpoint');
    }
  }, [checkpointSecondsRemaining, router]);

  useEffect(() => {
    if (isCheckpointMissed()) {
      finalizeLiveSession({ status: 'invalid' });
      router.replace('/missed-checkpoint');
    }
  }, [elapsedSeconds, router]);

  useEffect(() => {
    if (!getTrackerHasPaid() && isFreeTrialExpired(elapsedSeconds)) {
      router.push('/free-trial-done');
    }
  }, [elapsedSeconds, router]);

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <Animated.View style={[s.mapLayer, mapRevealStyle]}>
        <LiveSessionMap style={s.map} />
      </Animated.View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View style={[s.main, chromeStyle]} pointerEvents="box-none">
          <View style={s.navbar}>
            <TrackerBackButton onPress={() => router.replace('/')} />

            <View style={s.locationPill}>
              <View style={s.locationRow}>
                <LocationPinIcon color={C.textTertiary} size={18} strokeWidth={1.5} />
                <Text style={s.locationText}>
                  {isWeatherLoading && !placeLabel ? '…' : (placeLabel ?? 'Location off')}
                </Text>
              </View>
              <View style={s.pillDivider} />
              <View style={s.temperatureRow}>
                <TrackerWeatherIcon color={C.textTertiary} />
                <Text style={s.locationText}>
                  {isWeatherLoading ? '…' : temperatureLabel}
                </Text>
              </View>
            </View>

            <TrackerCompassControl />
          </View>

          <View style={s.inProgressSection} pointerEvents="box-none">
            <View style={s.timerBlock} pointerEvents="box-none">
              <PulsingTimerCard>
                <Text
                  style={s.timerText}
                  accessibilityLabel={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
                >
                  {formatElapsed(elapsedSeconds)}
                </Text>
                {showFreeTrialCountdown ? (
                  <Text
                    style={s.freeHourText}
                    accessibilityLabel={`Free hour remaining ${formatElapsed(freeTrialRemaining)}`}
                  >
                    {formatElapsed(freeTrialRemaining)}
                  </Text>
                ) : null}
                <View style={s.distanceRow}>
                  <Text style={s.distanceLabel}>Distance:</Text>
                  <Text style={s.distanceValue}>{formatDistanceMiles(distanceMiles)} miles</Text>
                </View>
              </PulsingTimerCard>
            </View>

            <View style={s.bottomSection} pointerEvents="box-none">
              <View style={s.checkpointSection} pointerEvents="box-none">
                <View style={s.mapTools}>
                  <View style={s.mapLayerControl}>
                    <MapToolButton
                      accessibilityLabel="Map layers"
                      onPress={() => setMapLayerPickerVisible((visible) => !visible)}
                    >
                      <TrackerLayersIcon color={C.textTertiary} />
                    </MapToolButton>
                  </View>
                  <MapToolButton
                    accessibilityLabel={mapFollowEnabled ? 'Stop following location' : 'Follow my location'}
                    onPress={toggleLiveSessionMapFollow}
                  >
                    <RouteIcon color={mapFollowEnabled ? C.primary : C.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel="Center on my location"
                    onPress={requestLiveSessionMapRecenter}
                  >
                    <TrackerMyLocationIcon color={C.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel={mapTheme === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
                    onPress={toggleManualMapTheme}
                  >
                    {mapTheme === 'dark'
                      ? <TrackerMapDarkIcon color={C.textTertiary} />
                      : <TrackerMapLightIcon color={C.textTertiary} />}
                  </MapToolButton>
                </View>

                <View style={s.checkpointCard}>
                  <View style={s.checkpointHeader}>
                    <Text style={s.checkpointTitle}>Checkpoint Photo</Text>
                    {showSubmissionCount && (
                      <Text style={s.checkpointSubmittedCount}>{submittedCheckpointLabel}</Text>
                    )}
                  </View>
                  {showSubmissionCount && (
                    <View
                      style={s.checkpointThumbs}
                      accessibilityLabel={`${submittedCheckpointCount} checkpoint photos submitted`}
                    >
                      {submittedCheckpoints.map((checkpoint, index) => (
                        <AnimatedPressable
                          key={checkpoint.id}
                          scaleTo={0.98}
                          onPress={() => openCheckpointPhotos(checkpoint.id)}
                          accessibilityRole="imagebutton"
                          accessibilityLabel={`View checkpoint ${index + 1} photos`}
                          style={[
                            index > 0 ? { marginLeft: -CHECKPOINT_THUMB_OVERLAP } : null,
                            { zIndex: index + 1 },
                          ]}
                        >
                          <ExpoImage
                            source={{ uri: checkpoint.selfieUri || checkpoint.progressUri }}
                            style={s.checkpointThumb}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={0}
                          />
                        </AnimatedPressable>
                      ))}
                    </View>
                  )}
                  <View style={s.nextPhotoBlock}>
                    <View style={s.nextPhotoRow}>
                      <Text style={s.nextPhotoLabel}>Next photo due in:</Text>
                      <Text style={s.nextPhotoTime}>
                        {formatCheckpointDue(checkpointSecondsRemaining)}
                      </Text>
                    </View>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${checkpointProgress * 100}%` }]} />
                    </View>
                  </View>
                </View>
              </View>

              <View style={s.actions}>
                <TrackerActionButton
                  label="Submit Photo"
                  variant="primary"
                  onPress={() => router.push('/photo-checkpoint')}
                  icon={<TrackerSubmitPhotoIcon color={C.textOnPrimary} size={24} />}
                />
                <TrackerActionButton
                  label="End Session"
                  variant="secondary"
                  onPress={() => {
                    finalizeLiveSession();
                    router.push('/session-feedback');
                  }}
                  icon={<TrackerEndSessionIcon color={C.textTertiary} size={24} />}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>

      <MapTypesSheet
        visible={mapLayerPickerVisible}
        selectedType={mapLayer}
        onSelect={setLiveSessionMapLayer}
        onClose={() => setMapLayerPickerVisible(false)}
      />

      <PhotoEnlargeModal
        visible={selectedPhotoIndex !== null && selectedPhoto !== null}
        uri={selectedPhoto?.uri ?? null}
        caption={selectedPhoto?.label}
        dateLabel={
          selectedPhoto ? formatSessionDateLabel(selectedPhoto.capturedAt) : undefined
        }
        timeLabel={
          selectedPhoto ? formatPhotoTimeLabel(selectedPhoto.capturedAt) : undefined
        }
        counterLabel={
          selectedPhotoIndex !== null && viewerPhotos.length > 0
            ? `${selectedPhotoIndex + 1}/${viewerPhotos.length}`
            : undefined
        }
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrevious={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={
          selectedPhotoIndex !== null && selectedPhotoIndex < viewerPhotos.length - 1
        }
        onPrevious={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index > 0 ? index - 1 : index,
          )
        }
        onNext={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index < viewerPhotos.length - 1 ? index + 1 : index,
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.mapTint,
    overflow: 'hidden',
  },

  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.mapTint,
  },

  map: {
    flex: 1,
    borderRadius: 0,
  },

  overlay: {
    flex: 1,
  },

  main: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 10,
  },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
    marginTop: 8,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.borderOutline,
    backgroundColor: C.textOnPrimary,
    overflow: 'hidden',
  },

  backBtnIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationPill: {
    width: 203,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: C.borderOutline,
    backgroundColor: C.textOnPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 16,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  locationText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: C.textTertiary,
  },

  pillDivider: {
    width: 1,
    height: 13,
    backgroundColor: C.borderOutline,
  },

  inProgressSection: {
    flex: 1,
    gap: 16,
  },

  timerBlock: {
    alignItems: 'center',
    gap: 10,
  },

  timerCard: {
    width: '100%',
    backgroundColor: C.textOnPrimary,
    borderWidth: 3,
    borderColor: C.accentLime,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },

  timerText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 38,
    lineHeight: 50,
    letterSpacing: 4,
    color: C.textPrimary,
    textAlign: 'center',
  },

  freeHourText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.5,
    color: C.primary,
    textAlign: 'center',
  },

  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  distanceLabel: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 16,
    color: C.textTertiary,
  },

  distanceValue: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 16,
    color: C.textTertiary,
  },

  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 30,
    paddingBottom: 8,
  },

  checkpointSection: {
    gap: 25,
  },

  mapTools: {
    alignSelf: 'flex-end',
    gap: 10,
    width: 44,
  },

  mapLayerControl: {
    position: 'relative',
    width: 44,
  },

  mapToolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.textTertiary,
    backgroundColor: C.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkpointCard: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 23,
    paddingVertical: 14,
    gap: 12,
    minHeight: 0,
  },

  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  checkpointTitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: C.textPrimary,
  },

  checkpointSubmittedCount: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: C.primary,
  },

  checkpointThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },

  checkpointThumb: {
    width: CHECKPOINT_THUMB_SIZE,
    height: CHECKPOINT_THUMB_SIZE,
    borderRadius: radius.sm,
    backgroundColor: C.borderOutline,
  },

  nextPhotoBlock: {
    gap: 10,
  },

  nextPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  nextPhotoLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: C.textPrimary,
  },

  nextPhotoTime: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 16,
    color: C.primary,
  },

  progressTrack: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: C.borderOutline,
    overflow: 'hidden',
  },

  progressFill: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: C.statusPending,
  },

  actions: {
    gap: 10,
  },
});
