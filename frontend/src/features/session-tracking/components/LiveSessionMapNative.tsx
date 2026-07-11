import { StyleSheet, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import {
  getLiveSessionMapCenter,
  getLiveSessionMapZoom,
  useLiveSession,
} from '../liveSessionStore';
import { colors, radius } from '../tokens';
import { LiveSessionMapCamera } from './LiveSessionMapCamera';

type Props = {
  style?: object;
};

/** MapLibre map branch — loaded only when not on Expo Go / web. */
export function LiveSessionMapNative({ style }: Props) {
  const { routeCoordinates, currentCoordinate, mapRecenterToken } = useLiveSession();
  const hasFix = currentCoordinate !== null;
  const mapCenter = getLiveSessionMapCenter();
  const routeStart = routeCoordinates[0] ?? null;

  return (
    <View style={[styles.container, style]}>
      <Map center={mapCenter} zoom={getLiveSessionMapZoom(hasFix)} showLoader>
        {routeCoordinates.length >= 2 && (
          <MapRoute coordinates={routeCoordinates} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <View style={styles.startMarker} />
          </MapMarker>
        )}

        {currentCoordinate && (
          <MapMarker longitude={currentCoordinate[0]} latitude={currentCoordinate[1]}>
            <View style={styles.currentMarker}>
              <View style={styles.currentMarkerDot} />
            </View>
          </MapMarker>
        )}

        <LiveSessionMapCamera
          currentCoordinate={currentCoordinate}
          recenterToken={mapRecenterToken}
        />
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  currentMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  currentMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
});
