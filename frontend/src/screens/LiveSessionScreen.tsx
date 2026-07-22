import { IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { TrackerWeatherIcon } from '@/features/session-tracking/components/icons/TrackerWeatherIcon';
import {
  formatElapsed,
  formatCheckpointDue,
} from '@/features/session-tracking/mocks/session';
import type { PhotoCheckpointSubmission } from '@/features/session-tracking/liveSessionStore';
import {
  evaluateCheckpointMissAndFinalize,
  ensureLocationWatching,
  ensureLiveSessionTicking,
  getCheckpointProgress,
  isCheckpointInGracePeriod,
  isCheckpointMissed,
  requestLiveSessionMapRecenter,
  setLiveSessionMapLayer,
  toggleLiveSessionMapFollow,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';
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
import { radius } from '@/features/session-tracking/tokens';
import {
  getTrackerChromeColors,
  type TrackerChromeColors,
} from '@/features/session-tracking/utils/trackerChromeTheme';
import {
  formatPhotoTimeLabel,
  formatSessionDateLabel,
  formatSubmittedCheckpointCount,
  shouldShowCheckpointSubmissionCount,
} from '@/features/session-tracking/utils/sessionFormat';

const TIMER_BORDER_PULSE_MS = 2400;
const CHECKPOINT_THUMB_SIZE = 44;
const CHECKPOINT_THUMB_OVERLAP = 16;

// Navbar row geometry (back button + location pill group, gap, compass size).
const NAVBAR_BACK_BTN_SIZE = 44;
const NAVBAR_GAP = 34;
const NAVBAR_LOCATION_PILL_WIDTH = 203;
const NAVBAR_COMPASS_SIZE = 48;

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
  if (!Number.isFinite(miles) || miles <= 0) {
    return '0.0';
  }
  // One decimal rounds short walks to "0.0" (e.g. 0.04 mi). Show hundredths
  // until the trail is long enough for tenths to be meaningful.
  if (miles < 0.1) {
    return miles.toFixed(2);
  }
  return miles.toFixed(1);
}

function PulsingTimerCard({
  children,
  chrome,
  styles,
}: {
  children: React.ReactNode;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
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
    <Animated.View
      style={[
        styles.timerCard,
        { backgroundColor: chrome.surface },
        borderStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function TrackerBackButton({
  onPress,
  chrome,
  styles,
}: {
  onPress: () => void;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AnimatedPressable
      style={[
        styles.backBtn,
        {
          borderColor: chrome.borderOutline,
          backgroundColor: chrome.surface,
        },
      ]}
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <View style={styles.backBtnIconWrap} pointerEvents="none">
        <SessionSetupBackChevronIcon color={chrome.textTertiary} width={8.485} height={14.142} />
      </View>
    </AnimatedPressable>
  );
}

function TrackerCompassControl({ chrome }: { chrome: TrackerChromeColors }) {
  const { currentHeading } = useLiveSession();

  return (
    <Compass
      size={NAVBAR_COMPASS_SIZE}
      borderColor={chrome.borderOutline}
      backgroundColor={chrome.surface}
      mutedColor={chrome.textTertiary}
      headingDegrees={currentHeading}
    />
  );
}

function MapToolButton({
  children,
  onPress,
  accessibilityLabel,
  chrome,
  styles,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  chrome: TrackerChromeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AnimatedPressable
      style={[
        styles.mapToolBtn,
        {
          borderColor: chrome.borderStrong,
          backgroundColor: chrome.surfaceMuted,
        },
      ]}
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
  const {
    elapsedSeconds,
    checkpointSecondsRemaining,
    distanceMiles,
    submittedCheckpoints,
    mapLayer,
    mapFollowEnabled,
    checkpointWindowStartedAt,
    sessionSyncWarning,
  } = useLiveSession();
  const [mapLayerPickerVisible, setMapLayerPickerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const mapTheme = useEffectiveMapTheme();
  const chrome = useMemo(() => getTrackerChromeColors(mapTheme), [mapTheme]);
  const s = useMemo(() => createStyles(chrome), [chrome]);
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
  const checkpointMissed = isCheckpointMissed();
  const freeTrialExpired = !getTrackerHasPaid() && isFreeTrialExpired(elapsedSeconds);
  const checkpointDueAlertedForWindow = useRef<number | null>(null);

  useEffect(() => {
    void ensureLocationWatching();
    ensureLiveSessionTicking();
  }, []);

  useEffect(() => {
    if (checkpointSecondsRemaining !== 0 || checkpointWindowStartedAt == null) {
      return;
    }

    if (checkpointDueAlertedForWindow.current === checkpointWindowStartedAt) {
      return;
    }

    checkpointDueAlertedForWindow.current = checkpointWindowStartedAt;
    void alertPhotoCheckpointDue();
    router.push('/photo-checkpoint');
  }, [checkpointSecondsRemaining, checkpointWindowStartedAt, router]);

  useEffect(() => {
    if (!isCheckpointInGracePeriod()) {
      return;
    }

    void alertPhotoCheckpointDue();
    const interval = setInterval(() => {
      void alertPhotoCheckpointDue();
    }, 45_000);

    return () => clearInterval(interval);
  }, [checkpointSecondsRemaining, checkpointWindowStartedAt]);

  useEffect(() => {
    if (checkpointMissed) {
      evaluateCheckpointMissAndFinalize();
      router.replace('/missed-checkpoint');
    }
  }, [checkpointMissed, router]);

  useEffect(() => {
    if (freeTrialExpired) {
      router.push('/free-trial-done');
    }
  }, [freeTrialExpired, router]);

  if (!fontsLoaded) {
    return <View style={[s.root, { backgroundColor: chrome.mapTint }]} />;
  }

  return (
    <View style={[s.root, { backgroundColor: chrome.mapTint }]}>
      <Animated.View
        style={[s.mapLayer, { backgroundColor: chrome.mapTint }, mapRevealStyle]}
      >
        <LiveSessionMap style={s.map} />
      </Animated.View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View style={[s.main, chromeStyle]} pointerEvents="box-none">
          {sessionSyncWarning ? (
            <View
              style={[
                s.syncWarningBanner,
                {
                  backgroundColor: chrome.surface,
                  borderColor: chrome.borderStrong,
                },
              ]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text style={[s.syncWarningText, { color: chrome.textPrimary }]}>
                {sessionSyncWarning}
              </Text>
            </View>
          ) : null}
          <View style={s.navbar}>
            <View style={s.navbarLeftGroup}>
              <TrackerBackButton
                onPress={() => router.replace('/')}
                chrome={chrome}
                styles={s}
              />

              <View
                style={[
                  s.locationPill,
                  {
                    borderColor: chrome.borderOutline,
                    backgroundColor: chrome.surface,
                  },
                ]}
              >
                <View style={s.locationRow}>
                  <LocationPinIcon color={chrome.textTertiary} size={18} strokeWidth={1.5} />
                  <Text style={[s.locationText, { color: chrome.textTertiary }]}>
                    {isWeatherLoading && !placeLabel ? '…' : (placeLabel ?? 'Location off')}
                  </Text>
                </View>
                <View style={[s.pillDivider, { backgroundColor: chrome.borderOutline }]} />
                <View style={s.temperatureRow}>
                  <TrackerWeatherIcon color={chrome.textTertiary} />
                  <Text style={[s.locationText, { color: chrome.textTertiary }]}>
                    {isWeatherLoading ? '…' : temperatureLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right-aligned to main's content edge — same boundary the map
                layers icon (mapTools, alignSelf:'flex-end') hugs below. */}
            <TrackerCompassControl chrome={chrome} />
          </View>

          <View style={s.inProgressSection} pointerEvents="box-none">
            <View style={s.timerBlock} pointerEvents="box-none">
              <PulsingTimerCard chrome={chrome} styles={s}>
                <Text
                  style={[s.timerText, { color: chrome.textPrimary }]}
                  accessibilityLabel={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
                >
                  {formatElapsed(elapsedSeconds)}
                </Text>
                {showFreeTrialCountdown ? (
                  <Text
                    style={[s.freeHourText, { color: chrome.primary }]}
                    accessibilityLabel={`Free hour remaining ${formatElapsed(freeTrialRemaining)}`}
                  >
                    {formatElapsed(freeTrialRemaining)}
                  </Text>
                ) : null}
                <View style={s.distanceRow}>
                  <Text style={[s.distanceLabel, { color: chrome.textTertiary }]}>Distance:</Text>
                  <Text style={[s.distanceValue, { color: chrome.textTertiary }]}>
                    {formatDistanceMiles(distanceMiles)} miles
                  </Text>
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
                      chrome={chrome}
                      styles={s}
                    >
                      <TrackerLayersIcon color={chrome.textTertiary} />
                    </MapToolButton>
                  </View>
                  <MapToolButton
                    accessibilityLabel={mapFollowEnabled ? 'Stop following location' : 'Follow my location'}
                    onPress={toggleLiveSessionMapFollow}
                    chrome={chrome}
                    styles={s}
                  >
                    <RouteIcon color={mapFollowEnabled ? chrome.primary : chrome.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel="Center on my location"
                    onPress={requestLiveSessionMapRecenter}
                    chrome={chrome}
                    styles={s}
                  >
                    <TrackerMyLocationIcon color={chrome.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel={mapTheme === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
                    onPress={toggleManualMapTheme}
                    chrome={chrome}
                    styles={s}
                  >
                    {mapTheme === 'dark'
                      ? <TrackerMapDarkIcon color={chrome.textTertiary} />
                      : <TrackerMapLightIcon color={chrome.textTertiary} />}
                  </MapToolButton>
                </View>

                <View
                  style={[
                    s.checkpointCard,
                    {
                      backgroundColor: chrome.surface,
                      borderColor: chrome.borderOutline,
                    },
                  ]}
                >
                  <View style={s.checkpointHeader}>
                    <Text style={[s.checkpointTitle, { color: chrome.textPrimary }]}>
                      Checkpoint Photo
                    </Text>
                    {showSubmissionCount && (
                      <Text style={[s.checkpointSubmittedCount, { color: chrome.primary }]}>
                        {submittedCheckpointLabel}
                      </Text>
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
                            style={[
                              s.checkpointThumb,
                              { backgroundColor: chrome.borderOutline },
                            ]}
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
                      <Text style={[s.nextPhotoLabel, { color: chrome.textPrimary }]}>
                        Next photo due in:
                      </Text>
                      <Text style={[s.nextPhotoTime, { color: chrome.primary }]}>
                        {formatCheckpointDue(checkpointSecondsRemaining)}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.progressTrack,
                        { backgroundColor: chrome.borderOutline },
                      ]}
                    >
                      <View
                        style={[
                          s.progressFill,
                          {
                            width: `${checkpointProgress * 100}%`,
                            backgroundColor: chrome.statusPending,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={s.actions}>
                <TrackerActionButton
                  label="End Session"
                  variant="secondary"
                  chrome={chrome}
                  onPress={() => router.push('/photo-capture?mode=session-end' as Href)}
                  icon={<TrackerEndSessionIcon color={chrome.textTertiary} size={24} />}
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
        mapTheme={mapTheme}
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

function createStyles(_chrome: TrackerChromeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      overflow: 'hidden',
    },
    mapLayer: {
      ...StyleSheet.absoluteFillObject,
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
    syncWarningBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    syncWarningText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      // space-between (not gap) — pushes the compass flush to the right edge
      // of `main`, matching mapTools' alignSelf:'flex-end' boundary below,
      // while the back button + location pill stay grouped on the left.
      justifyContent: 'space-between',
      marginTop: 8,
    },
    navbarLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: NAVBAR_GAP,
    },
    backBtn: {
      width: NAVBAR_BACK_BTN_SIZE,
      height: NAVBAR_BACK_BTN_SIZE,
      borderRadius: 30,
      borderWidth: 1,
      overflow: 'hidden',
    },
    backBtnIconWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationPill: {
      width: NAVBAR_LOCATION_PILL_WIDTH,
      height: 44,
      borderRadius: radius.full,
      borderWidth: 1,
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
    },
    pillDivider: {
      width: 1,
      height: 13,
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
      // 100% of `main`'s content width — same right boundary the compass
      // (space-between in navbar) and mapTools (alignSelf:'flex-end') hug.
      width: '100%',
      borderWidth: 3,
      borderColor: '#c2d832',
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
      textAlign: 'center',
    },
    freeHourText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 1.5,
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
    },
    distanceValue: {
      fontFamily: 'IBMPlexSans_500Medium',
      fontSize: 16,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkpointCard: {
      borderWidth: 1,
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
    },
    checkpointSubmittedCount: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
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
    },
    nextPhotoTime: {
      fontFamily: 'IBMPlexSans_600SemiBold',
      fontSize: 16,
    },
    progressTrack: {
      height: 4,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: radius.full,
    },
    actions: {
      gap: 10,
    },
  });
}
