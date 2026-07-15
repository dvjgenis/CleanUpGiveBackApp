import { StyleSheet, View } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import {
  getLiveSessionMapCenter,
  getLiveSessionMapZoom,
  useLiveSession,
} from '../liveSessionStore';
import { colors, radius } from '../tokens';
import { getNativeMapStyle } from '../utils/mapStyles';
import { smoothRouteForDisplay } from '../utils/routeFiltering';
import { LiveSessionMapCamera } from './LiveSessionMapCamera';
import { MapInteractionContainer } from './MapInteractionContainer';
import {
  SessionCurrentArrowMarker,
  SessionStartMarker,
} from './SessionMapMarkers';

type Props = {
  style?: object;
};

/** MapLibre map branch — loaded only when not on Expo Go / web. */
export function LiveSessionMapNative({ style }: Props) {
  const { routeCoordinates, currentCoordinate, currentHeading, mapRecenterToken, mapLayer } =
    useLiveSession();
  const hasFix = currentCoordinate !== null;
  const mapCenter = getLiveSessionMapCenter();
  const routeStart = routeCoordinates[0] ?? null;
  const mapStyle = getNativeMapStyle(mapLayer);
  const displayRoute = smoothRouteForDisplay(routeCoordinates);

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <Map
        key={mapLayer}
        styles={{ light: mapStyle, dark: mapStyle }}
        center={mapCenter}
        zoom={getLiveSessionMapZoom(hasFix)}
        showLoader
      >
        {displayRoute.length >= 2 && (
          <MapRoute coordinates={displayRoute} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <SessionStartMarker />
          </MapMarker>
        )}

        {currentCoordinate && (
          <MapMarker longitude={currentCoordinate[0]} latitude={currentCoordinate[1]}>
            <SessionCurrentArrowMarker heading={currentHeading} />
          </MapMarker>
        )}

        <LiveSessionMapCamera
          currentCoordinate={currentCoordinate}
          recenterToken={mapRecenterToken}
        />
      </Map>
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
