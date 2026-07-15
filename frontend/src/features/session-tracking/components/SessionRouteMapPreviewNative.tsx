import { StyleSheet } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { colors, radius } from '../tokens';
import { DEFAULT_MAP_LAYER, getNativeMapStyle, type MapLayerType } from '../utils/mapStyles';
import {
  getRouteMapCenter,
  getRouteMapZoom,
  type RouteCoordinate,
} from '../utils/geo';
import { simplifyRouteForDisplay } from '../utils/routeFiltering';
import { MapInteractionContainer } from './MapInteractionContainer';
import { SessionEndMarker, SessionStartMarker } from './SessionMapMarkers';

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  style?: object;
};

/** MapLibre branch for read-only session route previews. */
export function SessionRouteMapPreviewNative({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  style,
}: Props) {
  const mapCenter = getRouteMapCenter(routeCoordinates);
  const mapZoom = getRouteMapZoom(routeCoordinates);
  const routeStart = routeCoordinates[0] ?? null;
  const routeEnd = routeCoordinates[routeCoordinates.length - 1] ?? null;
  const mapStyle = getNativeMapStyle(mapLayer);
  const displayRoute = simplifyRouteForDisplay(routeCoordinates);

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <Map
        key={mapLayer}
        styles={{ light: mapStyle, dark: mapStyle }}
        center={mapCenter}
        zoom={mapZoom}
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

        {routeEnd && routeEnd !== routeStart && (
          <MapMarker longitude={routeEnd[0]} latitude={routeEnd[1]}>
            <SessionEndMarker />
          </MapMarker>
        )}
      </Map>
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
