import { IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { PulsingDot } from '@/components/motion/PulsingDot';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from '@/components/ui/Compass';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';
import { LiveSessionMap } from '@/features/session-tracking/components/LiveSessionMap';
import { TrackerActionButton } from '@/features/session-tracking/components/TrackerActionButton';
import { LocationPinIcon } from '@/features/session-tracking/components/icons/LocationPinIcon';
import { TrackerEndSessionIcon } from '@/features/session-tracking/components/icons/TrackerEndSessionIcon';
import { TrackerLayersIcon } from '@/features/session-tracking/components/icons/TrackerLayersIcon';
import { TrackerMyLocationIcon } from '@/features/session-tracking/components/icons/TrackerMyLocationIcon';
import { TrackerSubmitPhotoIcon } from '@/features/session-tracking/components/icons/TrackerSubmitPhotoIcon';
import { TrackerWeatherIcon } from '@/features/session-tracking/components/icons/TrackerWeatherIcon';
import {
  formatCheckpointDue,
  formatElapsed,
} from '@/features/session-tracking/mocks/session';
import { formatSubmittedCheckpointCount, shouldShowCheckpointSubmissionCount } from '@/features/session-tracking/utils/sessionFormat';
import {
  finalizeLiveSession,
  ensureLocationWatching,
  getCheckpointProgress,
  requestLiveSessionMapRecenter,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';
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
  return (
    <Compass
      size={48}
      borderColor={C.borderOutline}
      backgroundColor={C.textOnPrimary}
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
  const { elapsedSeconds, checkpointSecondsRemaining, distanceMiles, submittedCheckpoints } =
    useLiveSession();
  const { mapRevealStyle, chromeStyle } = useLiveSessionMapReveal();
  const submittedCheckpointCount = submittedCheckpoints.length;
  const showSubmissionCount = shouldShowCheckpointSubmissionCount(submittedCheckpoints);
  const submittedCheckpointLabel = formatSubmittedCheckpointCount(submittedCheckpointCount);
  const { placeLabel, temperatureLabel, isLoading: isWeatherLoading } = useLiveWeather();

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
  }, []);

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <Animated.View style={[s.mapLayer, mapRevealStyle]}>
        <LiveSessionMap style={s.map} />
      </Animated.View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View style={[s.main, chromeStyle]}>
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

          <View style={s.inProgressSection}>
            <View style={s.timerBlock}>
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
              </View>
            </View>

            <View style={s.bottomSection}>
              <View style={s.checkpointSection}>
                <View style={s.mapTools}>
                  <MapToolButton accessibilityLabel="Map layers">
                    <TrackerLayersIcon color={C.textTertiary} />
                  </MapToolButton>
                  <MapToolButton
                    accessibilityLabel="Center on my location"
                    onPress={requestLiveSessionMapRecenter}
                  >
                    <TrackerMyLocationIcon color={C.textTertiary} />
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
                      style={s.checkpointDots}
                      accessibilityLabel={`${submittedCheckpointCount} checkpoint photos submitted`}
                    >
                      {submittedCheckpoints.map((checkpoint) => (
                        <View key={checkpoint.id} style={s.checkpointDot} />
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
                    router.push('/submission-confirmation');
                  }}
                  icon={<TrackerEndSessionIcon color={C.textTertiary} size={24} />}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
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
    gap: 33,
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
    gap: 74,
  },

  timerBlock: {
    alignItems: 'center',
    gap: 10,
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
    paddingHorizontal: 35,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },

  timerText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 50,
    lineHeight: 68,
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
    paddingVertical: 20,
    gap: 25,
    minHeight: 127,
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

  checkpointDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  checkpointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
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
