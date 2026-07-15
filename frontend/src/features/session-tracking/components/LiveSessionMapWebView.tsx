import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  getLiveSessionMapCenter,
  useLiveSession,
} from '../liveSessionStore';
import { colors, radius } from '../tokens';
import { getMapStylePayload } from '../utils/mapStyles';
import { buildWebViewMapHelpers } from '../utils/webViewMapHelpers';
import { MapInteractionContainer } from './MapInteractionContainer';

const PRIMARY = colors.primary;
const START_COLOR = colors.textTertiary;
const MAP_HELPERS = buildWebViewMapHelpers(PRIMARY, START_COLOR);

function buildHtml() {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-98, 39],
    zoom: 3,
    attributionControl: false,
  });
  let routeAdded = false;
  let startMarker = null;
  let currentMarker = null;
  let currentMarkerElement = null;
  let hasInitialCentered = false;
  let lastRecenterToken = 0;
  let pendingCoords = [];
  let pendingCurrent = null;
  let pendingHeading = null;
  let pendingRecenterToken = 0;
  let pendingFollowEnabled = false;

  ${MAP_HELPERS}

  function syncMarkers(coords, current, heading) {
    const start = coords && coords.length > 0 ? coords[0] : null;
    if (start) {
      if (!startMarker) {
        startMarker = new maplibregl.Marker({ element: createStartMarkerElement(), anchor: 'center' })
          .setLngLat(start)
          .addTo(map);
      } else {
        startMarker.setLngLat(start);
      }
    }

    if (current && current.length === 2) {
      if (!currentMarker) {
        currentMarkerElement = createArrowMarkerElement(heading);
        currentMarker = new maplibregl.Marker({
          element: currentMarkerElement,
          anchor: 'center',
        }).setLngLat(current).addTo(map);
      } else {
        currentMarker.setLngLat(current);
        if (currentMarkerElement) {
          updateArrowMarkerElement(currentMarkerElement, heading);
        }
      }
    } else if (currentMarker) {
      currentMarker.remove();
      currentMarker = null;
      currentMarkerElement = null;
    }
  }

  function applyRouteOverlay(coords, current, heading, recenterToken, followEnabled) {
    pendingCoords = coords || [];
    pendingCurrent = current;
    pendingHeading = heading;
    pendingRecenterToken = recenterToken;
    pendingFollowEnabled = followEnabled;
    if (!map.isStyleLoaded()) return;

    const displayCoords = simplifyRouteForDisplay(pendingCoords);
    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: displayCoords } };
    if (!routeAdded && displayCoords.length >= 2) {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '${PRIMARY}', 'line-width': 4 },
      });
      routeAdded = true;
    } else if (routeAdded && map.getSource('route')) {
      map.getSource('route').setData(data);
    }

    syncMarkers(pendingCoords, pendingCurrent, pendingHeading);

    if (pendingCurrent && pendingCurrent.length === 2) {
      const recenterRequested = recenterToken !== lastRecenterToken;
      if (recenterRequested) {
        lastRecenterToken = recenterToken;
        map.flyTo({ center: pendingCurrent, zoom: 15, duration: 900 });
        return;
      }
      if (pendingFollowEnabled) {
        map.easeTo({ center: pendingCurrent, duration: 300 });
        return;
      }
      if (!hasInitialCentered) {
        hasInitialCentered = true;
        map.easeTo({ center: pendingCurrent, zoom: 15, duration: 0 });
      }
    }
  }

  map.on('load', () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });

  window.updateRoute = function(coords, current, heading, recenterToken, followEnabled) {
    applyRouteOverlay(coords, current, heading, recenterToken, !!followEnabled);
  };

  window.setMapStyle = function(stylePayload) {
    routeAdded = false;
    startMarker = null;
    currentMarker = null;
    currentMarkerElement = null;
    const style = stylePayload.type === 'url' ? stylePayload.value : stylePayload.value;
    map.setStyle(style);
    map.once('style.load', () => {
      applyRouteOverlay(
        pendingCoords,
        pendingCurrent,
        pendingHeading,
        pendingRecenterToken,
        pendingFollowEnabled,
      );
    });
  };
</script>
</body>
</html>`;
}

type Props = {
  style?: object;
};

/** MapLibre GL JS map for Expo Go — live GPS route updates via injectJavaScript. */
export function LiveSessionMapWebView({ style }: Props) {
  const {
    routeCoordinates,
    displayCoordinate,
    currentHeading,
    mapRecenterToken,
    mapFollowEnabled,
    mapLayer,
  } = useLiveSession();
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const center = displayCoordinate ?? getLiveSessionMapCenter();
    const script = `window.updateRoute(${JSON.stringify(routeCoordinates)}, ${JSON.stringify(center)}, ${currentHeading ?? 'null'}, ${mapRecenterToken}, ${mapFollowEnabled}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushStyleUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const stylePayload = getMapStylePayload(mapLayer);
    const script = `window.setMapStyle(${JSON.stringify(stylePayload)}); true;`;
    webRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    pushRouteUpdate();
  }, [routeCoordinates, displayCoordinate, currentHeading, mapRecenterToken, mapFollowEnabled]);

  useEffect(() => {
    pushStyleUpdate();
  }, [mapLayer]);

  return (
    <MapInteractionContainer style={[styles.container, style]}>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        source={{ html: buildHtml() }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'ready') {
            readyRef.current = true;
            if (mapLayer !== 'standard') {
              pushStyleUpdate();
            }
            pushRouteUpdate();
          }
        }}
      />
    </MapInteractionContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
});
