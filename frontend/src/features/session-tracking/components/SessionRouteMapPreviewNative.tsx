import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Map, MapMarker, MapRoute } from '@/components/ui/map';

import { colors, radius } from '../tokens';
import { DEFAULT_MAP_LAYER, getNativeMapStyle, type MapLayerType } from '../utils/mapStyles';
import {
  getRouteMapCenter,
  getRouteMapZoom,
  type RouteCoordinate,
} from '../utils/geo';
import { simplifyRouteForDisplay, computeBearingDegrees } from '../utils/routeFiltering';
import { MapInteractionContainer } from './MapInteractionContainer';
import { SessionCurrentArrowMarker, SessionEndMarker, SessionStartMarker } from './SessionMapMarkers';

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  replayProgress?: number;
  style?: object;
};

function sliceRouteByProgress(coords: RouteCoordinate[], progress: number): RouteCoordinate[] {
  if (coords.length < 2) {
    return coords;
  }

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped >= 1) {
    return coords;
  }

  const targetIndex = Math.max(1, Math.round(clamped * (coords.length - 1)));
  return coords.slice(0, targetIndex + 1);
}

/** MapLibre branch for read-only session route previews. */
export function SessionRouteMapPreviewNative({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayProgress = 1,
  style,
}: Props) {
  const displayRoute = useMemo(
    () => simplifyRouteForDisplay(routeCoordinates),
    [routeCoordinates],
  );
  const visibleRoute = useMemo(
    () => sliceRouteByProgress(displayRoute, replayProgress),
    [displayRoute, replayProgress],
  );

  const mapCenter = getRouteMapCenter(displayRoute);
  const mapZoom = getRouteMapZoom(displayRoute);
  const routeStart = visibleRoute[0] ?? null;
  const routeHead = visibleRoute[visibleRoute.length - 1] ?? null;
  const replayHeading =
    visibleRoute.length >= 2
      ? computeBearingDegrees(visibleRoute[visibleRoute.length - 2], routeHead!)
      : null;
  const showFinalEnd = replayProgress >= 1;
  const mapStyle = getNativeMapStyle(mapLayer);

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <Map
        key={mapLayer}
        styles={{ light: mapStyle, dark: mapStyle }}
        center={mapCenter}
        zoom={mapZoom}
        showLoader
      >
        {visibleRoute.length >= 2 && (
          <MapRoute coordinates={visibleRoute} color={colors.primary} width={4} />
        )}

        {routeStart && (
          <MapMarker longitude={routeStart[0]} latitude={routeStart[1]}>
            <SessionStartMarker />
          </MapMarker>
        )}

        {routeHead && routeHead !== routeStart && showFinalEnd && (
          <MapMarker longitude={routeHead[0]} latitude={routeHead[1]}>
            <SessionEndMarker />
          </MapMarker>
        )}

        {routeHead && routeHead !== routeStart && !showFinalEnd && (
          <MapMarker longitude={routeHead[0]} latitude={routeHead[1]}>
            <SessionCurrentArrowMarker heading={replayHeading} />
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
