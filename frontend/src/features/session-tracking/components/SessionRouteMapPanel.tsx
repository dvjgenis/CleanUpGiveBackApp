import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { formatCountdown } from '../mocks/session';
import { colors, radius, textStyles } from '../tokens';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { Icon } from './Icon';
import { PauseIcon } from './icons/PauseIcon';
import { PlayIcon } from './icons/PlayIcon';
import { ReplayIcon } from './icons/ReplayIcon';
import { SessionRouteMapPreview } from './SessionRouteMapPreview';

const REPLAY_DURATION_MS = 8000;
const REPLAY_DURATION_SECONDS = REPLAY_DURATION_MS / 1000;

type Props = {
  routeCoordinates: RouteCoordinate[];
  /** Animate the route drawing once (grow line + tip marker) instead of showing it fully drawn. Expo Go / WebView only. */
  replayOnce?: boolean;
  /** Basemap layer to open on — e.g. the layer the user had selected when
   * the session ended. Defaults to `DEFAULT_MAP_LAYER`. */
  initialMapLayer?: MapLayerType;
  style?: object;
  enableReplay?: boolean;
};

function SessionRouteMapEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Icon name="locationPin" size={28} color={colors.textTertiary} />
      <Text style={[textStyles.bodySmall, styles.emptyTitle]}>No route recorded</Text>
    </View>
  );
}

function replayClockSeconds(progress: number): number {
  return Math.round(Math.max(0, Math.min(1, progress)) * REPLAY_DURATION_SECONDS);
}

/** Interactive route preview with pan/zoom and optional replay controls. */
export function SessionRouteMapPanel({
  routeCoordinates,
  replayOnce = false,
  initialMapLayer = DEFAULT_MAP_LAYER,
  enableReplay = true,
  style,
}: Props) {
  const [mapLayer] = useState<MapLayerType>(initialMapLayer);
  const [replayProgress, setReplayProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const playStartRef = useRef(0);
  const playFromRef = useRef(0);
  const hasAutoPlayedRef = useRef(false);

  const hasRoute = routeCoordinates.length >= 2;
  const canReplay = enableReplay && hasRoute;
  const showControls = hasRoute && canReplay;
  const currentSeconds = replayClockSeconds(canReplay ? replayProgress : 1);
  const totalSeconds = REPLAY_DURATION_SECONDS;
  const timeLabel = `${formatCountdown(currentSeconds)} / ${formatCountdown(totalSeconds)}`;

  const stopAnimation = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const tickReplay = useCallback(() => {
    const elapsed = Date.now() - playStartRef.current;
    const next = Math.min(1, playFromRef.current + elapsed / REPLAY_DURATION_MS);
    setReplayProgress(next);

    if (next >= 1) {
      setIsPlaying(false);
      animationRef.current = null;
      return;
    }

    animationRef.current = requestAnimationFrame(tickReplay);
  }, []);

  const startReplay = useCallback(
    (fromProgress = 0) => {
      stopAnimation();
      playFromRef.current = fromProgress;
      playStartRef.current = Date.now();
      setReplayProgress(fromProgress);
      setIsPlaying(true);
    },
    [stopAnimation],
  );

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    animationRef.current = requestAnimationFrame(tickReplay);

    return () => {
      stopAnimation();
    };
  }, [isPlaying, stopAnimation, tickReplay]);

  useEffect(() => {
    setReplayProgress(1);
    setIsPlaying(false);
    stopAnimation();
    hasAutoPlayedRef.current = false;
  }, [routeCoordinates, stopAnimation]);

  useEffect(() => {
    if (!canReplay || !replayOnce || hasAutoPlayedRef.current) {
      return;
    }

    hasAutoPlayedRef.current = true;
    startReplay(0);
  }, [canReplay, replayOnce, routeCoordinates, startReplay]);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAnimation();
      setIsPlaying(false);
      return;
    }

    if (replayProgress >= 1) {
      startReplay(0);
      return;
    }

    playFromRef.current = replayProgress;
    playStartRef.current = Date.now();
    setIsPlaying(true);
  };

  const handleReplay = () => {
    startReplay(0);
  };

  return (
    <View style={[styles.panel, style]}>
      {hasRoute ? (
        <SessionRouteMapPreview
          routeCoordinates={routeCoordinates}
          mapLayer={mapLayer}
          replayProgress={canReplay ? replayProgress : 1}
          style={styles.map}
        />
      ) : (
        <SessionRouteMapEmptyState />
      )}

      {showControls && (
        <View style={styles.controls} pointerEvents="box-none">
          {canReplay && (
            <View style={styles.replayRow}>
              <View
                style={styles.timePill}
                accessibilityRole="timer"
                accessibilityLabel={`Replay time ${timeLabel}`}
              >
                <Text style={styles.timeText}>{timeLabel}</Text>
              </View>

              <AnimatedPressable
                style={styles.iconButton}
                scaleTo={0.96}
                onPress={handlePlayPause}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause route replay' : 'Play route replay'}
              >
                {isPlaying ? (
                  <PauseIcon color={colors.textPrimary} size={20} />
                ) : (
                  <PlayIcon color={colors.textPrimary} size={20} />
                )}
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.iconButton}
                scaleTo={0.96}
                onPress={handleReplay}
                accessibilityRole="button"
                accessibilityLabel="Replay route from start"
              >
                <ReplayIcon color={colors.textPrimary} size={20} />
              </AnimatedPressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.textTertiary,
    textAlign: 'center',
  },

  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
  },
  replayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePill: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
