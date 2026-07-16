import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors, radius, textStyles } from '../tokens';
import { DEFAULT_MAP_LAYER, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { Icon } from './Icon';
import { MapLayerPicker } from './MapLayerPicker';
import { TrackerLayersIcon } from './icons/TrackerLayersIcon';
import { SessionRouteMapPreview } from './SessionRouteMapPreview';

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
};

function SessionRouteMapEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Icon name="locationPin" size={28} color={colors.textTertiary} />
      <Text style={[textStyles.bodySmall, styles.emptyTitle]}>No route recorded</Text>
    </View>
  );
}

/** Interactive route preview with pan/zoom and basemap layer picker. */
export function SessionRouteMapPanel({
  routeCoordinates,
  replayOnce = false,
  showLayerControl = true,
  initialMapLayer = DEFAULT_MAP_LAYER,
  style,
}: Props) {
  const [mapLayer, setMapLayer] = useState<MapLayerType>(initialMapLayer);
  const [pickerVisible, setPickerVisible] = useState(false);
  const hasRoute = routeCoordinates.length >= 2;

  return (
    <View style={[styles.panel, style]}>
      {hasRoute ? (
        <SessionRouteMapPreview
          routeCoordinates={routeCoordinates}
          mapLayer={mapLayer}
          replayOnce={replayOnce}
          style={styles.map}
        />
      ) : (
        <SessionRouteMapEmptyState />
      )}

      {hasRoute && showLayerControl && (
        <View style={styles.controls} pointerEvents="box-none">
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
