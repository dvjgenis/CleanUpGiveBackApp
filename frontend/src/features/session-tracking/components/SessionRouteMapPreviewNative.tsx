import { StyleSheet, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { colors, radius } from '../tokens';
import {
  getRouteMapCenter,
  getRouteMapZoom,
  type RouteCoordinate,
} from '../utils/geo';

type Props = {
  routeCoordinates: RouteCoordinate[];
  style?: object;
};

/** MapLibre branch for read-only session route previews. */
export function SessionRouteMapPreviewNative({ routeCoordinates, style }: Props) {
  const mapCenter = getRouteMapCenter(routeCoordinates);
  const mapZoom = getRouteMapZoom(routeCoordinates);
  const routeStart = routeCoordinates[0] ?? null;
  const routeEnd = routeCoordinates[routeCoordinates.length - 1] ?? null;

  return (
    <View style={[styles.container, style]}>
      <Map center={mapCenter} zoom={mapZoom} showLoader>
        {routeCoordinates.length >= 2 && (
          <MapRoute coordinates={routeCoordinates} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <View style={styles.startMarker} />
          </MapMarker>
        )}

        {routeEnd && routeEnd !== routeStart && (
          <MapMarker longitude={routeEnd[0]} latitude={routeEnd[1]}>
            <View style={styles.endMarker}>
              <View style={styles.endMarkerDot} />
            </View>
          </MapMarker>
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textTertiary,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  endMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  endMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
});
