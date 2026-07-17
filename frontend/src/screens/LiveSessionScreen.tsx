import { IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { PulsingDot } from '@/components/motion/PulsingDot';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from '@/components/ui/Compass';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { FreeTrialModal } from '@/features/session-tracking/components/FreeTrialModal';
import { LiveSessionMap } from '@/features/session-tracking/components/LiveSessionMap';
import { MapTypesSheet } from '@/features/session-tracking/components/MapTypesSheet';
import { TrackerActionButton } from '@/features/session-tracking/components/TrackerActionButton';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { TrackerEndSessionIcon } from '@/features/session-tracking/components/icons/TrackerEndSessionIcon';
import { alertPhotoCheckpointDue } from '@/utils/photoCheckpointAlert';
import { TrackerLayersIcon } from '@/features/session-tracking/components/icons/TrackerLayersIcon';
import { RouteIcon } from '@/features/session-tracking/components/icons/RouteIcon';
import { TrackerMyLocationIcon } from '@/features/session-tracking/components/icons/TrackerMyLocationIcon';
import { TrackerSubmitPhotoIcon } from '@/features/session-tracking/components/icons/TrackerSubmitPhotoIcon';
import { WeatherConditionIcon } from '@/features/session-tracking/components/icons/WeatherConditionIcon';
import {
  TrackerMapDarkIcon,
  TrackerMapLightIcon,
} from '@/features/session-tracking/components/icons/TrackerMapThemeIcons';
import { ChevronLeftIcon } from '@/features/session-tracking/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/features/session-tracking/components/icons/ChevronRightIcon';
import { CloseIcon } from '@/features/session-tracking/components/icons/CloseIcon';
import {
  formatCheckpointDue,
  formatCountdown,
  formatElapsed,
} from '@/features/session-tracking/mocks/session';
import { formatSubmittedCheckpointCount, shouldShowCheckpointSubmissionCount } from '@/features/session-tracking/utils/sessionFormat';
import {
  finalizeLiveSession,
  ensureLocationWatching,
  ensureLiveSessionTicking,
  getCheckpointProgress,
  requestLiveSessionMapRecenter,
  setLiveSessionMapLayer,
  toggleLiveSessionMapFollow,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
import {
  getFreeTrialSecondsRemaining,
  isFreeTrialExpired,
  useTrackerHasPaid,
} from '@/features/session-tracking/trackerPaymentStore';
import {
  toggleManualMapTheme,
  useEffectiveMapTheme,
} from '@/features/session-tracking/mapThemeStore';
import { useLiveWeather } from '@/features/session-tracking/hooks/useLiveWeather';
import { useLiveSessionMapReveal } from '@/features/session-tracking/hooks/useLiveSessionMapReveal';
import { colors, radius } from '@/features/session-tracking/tokens';

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

function formatDistanceMiles(miles: number): string {
  if (miles === 0) {
    return '0';
  }
  return miles.toFixed(1);
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
  active = false,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Selected / on state — brand primary border + mint fill. */
  active?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <AnimatedPressable
      style={[
        s.mapToolBtn,
        active && s.mapToolBtnActive,
        pressed && s.mapToolBtnPressed,
      ]}
      scaleTo={0.96}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}

/** PRD §6.11 · Figma `session_setup_guide` live tracker (`251:439`). */
export function LiveSessionScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const {
    isActive,
    elapsedSeconds,
    checkpointSecondsRemaining,
    distanceMiles,
    submittedCheckpoints,
    mapLayer,
    mapFollowEnabled,
  } = useLiveSession();
  const hasPaid = useTrackerHasPaid();
  const mapTheme = useEffectiveMapTheme();
  const { mapRevealStyle, chromeStyle } = useLiveSessionMapReveal();
  const submittedCheckpointCount = submittedCheckpoints.length;
  const showSubmissionCount = shouldShowCheckpointSubmissionCount(submittedCheckpoints);
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(submittedCheckpointCount);
  const {
    placeLabel,
    temperatureLabel,
    weatherIcon,
    isLoading: isWeatherLoading,
  } = useLiveWeather();
  const [mapTypesVisible, setMapTypesVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  /** Pay Later dismisses the paywall for this session mount so it does not reappear every tick. */
  const [freeTrialDismissed, setFreeTrialDismissed] = useState(false);
  /** Prevents repeating sound/haptic/navigation while the countdown stays at 0. */
  const checkpointDueAlertFiredRef = useRef(false);
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const checkpointProgress = getCheckpointProgress(checkpointSecondsRemaining);
  const freeTrialSecondsRemaining = getFreeTrialSecondsRemaining(elapsedSeconds);
  const showFreeTrialCountdown = !hasPaid && !isFreeTrialExpired(elapsedSeconds);
  const showFreeTrialPaywall =
    !hasPaid && !freeTrialDismissed && isFreeTrialExpired(elapsedSeconds);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    void ensureLocationWatching();
    ensureLiveSessionTicking();
  }, [isActive]);

  useEffect(() => {
    if (checkpointSecondsRemaining > 0) {
      checkpointDueAlertFiredRef.current = false;
      return;
    }

    if (checkpointSecondsRemaining !== 0 || checkpointDueAlertFiredRef.current) {
      return;
    }

    checkpointDueAlertFiredRef.current = true;
    void alertPhotoCheckpointDue();
    router.push('/photo-checkpoint');
  }, [checkpointSecondsRemaining, router]);

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
            <TrackerBackButton onPress={() => from === 'onboarding' ? router.replace('/') : router.back()} />

            <View style={s.locationPill}>
              <View style={s.locationRow}>
                <LocationPinIcon color={C.textTertiary} size={18} strokeWidth={1.5} />
                <Text style={s.locationText}>
                  {isWeatherLoading && !placeLabel ? '…' : (placeLabel ?? 'Location off')}
                </Text>
              </View>
              <View style={s.pillDivider} />
              <View style={s.temperatureRow}>
                <WeatherConditionIcon condition={weatherIcon} color={C.textTertiary} size={18} />
                <Text style={s.locationText}>
                  {isWeatherLoading ? '…' : temperatureLabel}
                </Text>
              </View>
            </View>

            <TrackerCompassControl />
          </View>

          <View style={s.inProgressSection} pointerEvents="box-none">
            <View style={s.timerBlock} pointerEvents="box-none">
              <View style={s.statusBadge}>
                <PulsingDot color={C.textTertiary} size={8} />
                <Text style={s.statusText}>IN PROGRESS</Text>
              </View>

              <View style={s.timerCard}>
                <Text
                  style={s.timerText}
                  accessibilityLabel={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
                >
                  {formatElapsed(elapsedSeconds)}
                </Text>
                <View style={s.distanceRow}>
                  <Text style={s.distanceLabel}>Distance:</Text>
                  <Text style={s.distanceValue}>{formatDistanceMiles(distanceMiles)} miles</Text>
                </View>
                {showFreeTrialCountdown && (
                  <View
                    style={s.freeTrialRow}
                    accessibilityLabel={`Free hour left ${formatCountdown(freeTrialSecondsRemaining)}`}
                  >
                    <Text style={s.freeTrialLabel}>Free hour left:</Text>
                    <Text style={s.freeTrialValue}>
                      {formatCountdown(freeTrialSecondsRemaining)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={s.bottomSection} pointerEvents="box-none">
              <View style={s.checkpointSection} pointerEvents="box-none">
                <View style={s.mapTools} collapsable={false}>
                  <MapToolButton
                    accessibilityLabel="Map layers"
                    onPress={() => setMapTypesVisible(true)}
                  >
                    <TrackerLayersIcon color={C.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel={
                      mapTheme === 'dark'
                        ? 'Switch Standard map to light mode'
                        : 'Switch Standard map to dark mode'
                    }
                    active={mapTheme === 'dark'}
                    onPress={toggleManualMapTheme}
                  >
                    {mapTheme === 'dark' ? (
                      <TrackerMapDarkIcon color={C.primary} size={22} />
                    ) : (
                      <TrackerMapLightIcon color={C.textTertiary} size={22} />
                    )}
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel={mapFollowEnabled ? 'Stop following location' : 'Follow my location'}
                    active={mapFollowEnabled}
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
                </View>

                <View style={s.checkpointCard}>
                  {showSubmissionCount && (() => {
                    const MAX_VISIBLE = 5;
                    const startIndex = Math.max(0, submittedCheckpoints.length - MAX_VISIBLE);
                    const visible = submittedCheckpoints.slice(startIndex);
                    const overflow = submittedCheckpoints.length - MAX_VISIBLE;
                    return (
                      <View
                        style={s.photoStack}
                        accessibilityLabel={`${submittedCheckpointCount} checkpoint photos submitted`}
                      >
                        {visible.map((checkpoint, i) => (
                          <AnimatedPressable
                            key={checkpoint.id}
                            style={[s.photoThumbWrap, i > 0 && s.photoThumbOverlap]}
                            scaleTo={0.95}
                            onPress={() => setSelectedPhotoIndex((startIndex + i) * 2)}
                            accessibilityRole="button"
                            accessibilityLabel="View checkpoint photo"
                          >
                            <Image
                              source={{ uri: checkpoint.progressUri }}
                              style={s.photoThumb}
                            />
                          </AnimatedPressable>
                        ))}
                        {overflow > 0 && (
                          <View style={[s.photoOverflow, s.photoThumbOverlap]}>
                            <Text style={s.photoOverflowText}>+{overflow}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
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
        visible={mapTypesVisible}
        selectedType={mapLayer}
        onSelect={setLiveSessionMapLayer}
        onClose={() => setMapTypesVisible(false)}
      />

      <Modal
        visible={showFreeTrialPaywall}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setFreeTrialDismissed(true)}
      >
        <FreeTrialModal
          onContinue={() =>
            router.push('/checkout?mode=tracker&returnTo=live-session' as Href)
          }
          onPayLater={() => setFreeTrialDismissed(true)}
        />
      </Modal>

      {(() => {
        const allPhotos = submittedCheckpoints.flatMap((cp) => [
          { uri: cp.selfieUri, label: 'Selfie', capturedAt: cp.capturedAt },
          { uri: cp.progressUri, label: 'Cleanup Area', capturedAt: cp.capturedAt },
        ]);
        const photo = selectedPhotoIndex !== null ? allPhotos[selectedPhotoIndex] : null;
        const hasPrev = selectedPhotoIndex !== null && selectedPhotoIndex > 0;
        const hasNext = selectedPhotoIndex !== null && selectedPhotoIndex < allPhotos.length - 1;
        return (
          <Modal
            visible={selectedPhotoIndex !== null}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setSelectedPhotoIndex(null)}
          >
            {photo !== null && (
              <View style={s.photoModalRoot}>
                <Image
                  source={{ uri: photo.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />

                {/* Top bar: label + timestamp + counter + close */}
                {(() => {
                  const ts = new Date(photo.capturedAt);
                  const timeLabel = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateLabel = ts.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return (
                <View style={s.photoModalTopBar}>
                  <View style={s.photoModalChip}>
                    <Text style={s.photoModalChipText}>{photo.label}</Text>
                  </View>
                  <View style={s.photoModalChip}>
                    <Text style={s.photoModalChipText}>{dateLabel} · {timeLabel}</Text>
                  </View>
                  <View style={s.photoModalChip}>
                    <Text style={s.photoModalChipText}>
                      {(selectedPhotoIndex ?? 0) + 1} / {allPhotos.length}
                    </Text>
                  </View>
                  <AnimatedPressable
                    style={s.photoModalClose}
                    scaleTo={0.92}
                    onPress={() => setSelectedPhotoIndex(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <CloseIcon color={C.textOnPrimary} size={20} strokeWidth={2} />
                  </AnimatedPressable>
                </View>
                  );
                })()}

                {/* Side nav arrows */}
                {hasPrev && (
                  <AnimatedPressable
                    style={s.photoNavLeft}
                    scaleTo={0.92}
                    onPress={() => setSelectedPhotoIndex((selectedPhotoIndex ?? 1) - 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous photo"
                  >
                    <ChevronLeftIcon color={C.textOnPrimary} size={22} strokeWidth={2.5} />
                  </AnimatedPressable>
                )}
                {hasNext && (
                  <AnimatedPressable
                    style={s.photoNavRight}
                    scaleTo={0.92}
                    onPress={() => setSelectedPhotoIndex((selectedPhotoIndex ?? 0) + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Next photo"
                  >
                    <ChevronRightIcon color={C.textOnPrimary} size={22} strokeWidth={2.5} />
                  </AnimatedPressable>
                )}
              </View>
            )}
          </Modal>
        );
      })()}

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
    gap: 20,
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
    gap: 40,
  },

  timerBlock: {
    alignItems: 'center',
    gap: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentLime,
    borderWidth: 1,
    borderColor: C.accentLime,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  statusText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: C.textTertiary,
  },

  timerCard: {
    width: '100%',
    backgroundColor: C.textOnPrimary,
    borderWidth: 3,
    borderColor: C.accentLime,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },

  timerText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 42,
    lineHeight: 56,
    letterSpacing: 5,
    color: C.textPrimary,
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

  freeTrialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  freeTrialLabel: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 14,
    color: C.textTertiary,
  },

  freeTrialValue: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 14,
    color: C.primary,
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
    zIndex: 20,
    elevation: 20,
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
    zIndex: 20,
    elevation: 20,
  },

  mapToolBtnPressed: {
    backgroundColor: '#f7fff1',
    borderColor: C.primary,
  },

  mapToolBtnActive: {
    backgroundColor: '#f7fff1',
    borderColor: C.primary,
  },

  checkpointCard: {
    backgroundColor: C.textOnPrimary,
    borderWidth: 1,
    borderColor: C.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 23,
    paddingVertical: 20,
    gap: 16,
  },

  photoStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  photoThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.textOnPrimary,
    overflow: 'hidden',
  },

  photoThumbOverlap: {
    marginLeft: -14,
  },

  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: C.borderOutline,
  },

  photoOverflow: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.textOnPrimary,
    backgroundColor: C.borderOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoOverflowText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: C.textTertiary,
  },

  photoModalRoot: {
    flex: 1,
    backgroundColor: '#000',
  },

  photoModalTopBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 20,
  },

  photoModalChip: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  photoModalChipText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: C.textOnPrimary,
  },

  photoModalClose: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoNavLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  photoNavRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  nextPhotoBlock: {
    gap: 15,
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
