import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors, radius, textStyles } from '../tokens';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { Icon } from './Icon';
import { MapLayerPicker } from './MapLayerPicker';
import { TrackerLayersIcon } from './icons/TrackerLayersIcon';
import { SessionRouteMapPreview } from './SessionRouteMapPreview';

const REPLAY_DURATION_MS = 8000;

type Props = {
  routeCoordinates: RouteCoordinate[];
  /** Animate the route drawing once (grow line + tip marker) instead of showing it fully drawn. Expo Go / WebView only. */
  replayOnce?: boolean;
  /** Show the basemap layer picker toggle button. Defaults to true. */
  showLayerControl?: boolean;
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

/** Interactive route preview with pan/zoom, basemap picker, and optional replay. */
export function SessionRouteMapPanel({
  routeCoordinates,
  replayOnce = false,
  showLayerControl = true,
  initialMapLayer = DEFAULT_MAP_LAYER,
  enableReplay = true,
  style,
}: Props) {
  const [mapLayer, setMapLayer] = useState<MapLayerType>(initialMapLayer);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [replayProgress, setReplayProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const playStartRef = useRef(0);
  const playFromRef = useRef(0);

  const hasRoute = routeCoordinates.length >= 2;
  const canReplay = enableReplay && hasRoute;

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
  }, [routeCoordinates, stopAnimation]);

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

      {hasRoute && showLayerControl && (
        <View style={styles.controls} pointerEvents="box-none">
          {canReplay && (
            <View style={styles.replayRow}>
              <AnimatedPressable
                style={styles.replayButton}
                scaleTo={0.98}
                onPress={handlePlayPause}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause route replay' : 'Play route replay'}
              >
                <Text style={styles.replayButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.replayButton}
                scaleTo={0.98}
                onPress={handleReplay}
                accessibilityRole="button"
                accessibilityLabel="Replay route from start"
              >
                <Text style={styles.replayButtonText}>Replay</Text>
              </AnimatedPressable>
            </View>
          )}

          <View style={styles.layerControl}>
            {pickerVisible && (
              <MapLayerPicker
                currentLayer={mapLayer}
                onSelect={setMapLayer}
                onClose={() => setPickerVisible(false)}
              />
            )}
            <AnimatedPressable
              style={styles.layerButton}
              scaleTo={0.98}
              onPress={() => setPickerVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel="Map layers"
            >
              <TrackerLayersIcon color={colors.textTertiary} />
            </AnimatedPressable>
          </View>
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
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
  },
  replayRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginRight: 52,
  },
  replayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    backgroundColor: colors.bgApp,
  },
  replayButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  layerControl: {
    position: 'relative',
    width: 44,
  },
  layerButton: {
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
