import { StyleSheet } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { useEffectiveMapTheme } from '../mapThemeStore';
import { colors, radius } from '../tokens';
import {
  DEFAULT_MAP_LAYER,
  getNativeMapStyle,
  getReplayStartMarkerColors,
  type MapLayerType,
} from '../utils/mapStyles';
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
  const mapTheme = useEffectiveMapTheme();
  const mapCenter = getRouteMapCenter(routeCoordinates);
  const mapZoom = getRouteMapZoom(routeCoordinates);
  const routeStart = routeCoordinates[0] ?? null;
  const routeEnd = routeCoordinates[routeCoordinates.length - 1] ?? null;
  const mapStyle = getNativeMapStyle(mapLayer, mapTheme);
  const displayRoute = simplifyRouteForDisplay(routeCoordinates);
  const startColors = getReplayStartMarkerColors(mapLayer, mapTheme);
  const styleKey = `${mapLayer}-${mapTheme}`;

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <Map
        key={styleKey}
        mapStyle={mapStyle}
        center={mapCenter}
        zoom={mapZoom}
        showLoader
      >
        {displayRoute.length >= 2 && (
          <MapRoute coordinates={displayRoute} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <SessionStartMarker color={startColors.fill} borderColor={startColors.border} />
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
