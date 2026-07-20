import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, radius } from '../tokens';
import { DEFAULT_MAP_LAYER, getMapStylePayload, type MapLayerType } from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
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
  let endMarker = null;
  let replayMarker = null;
  let pendingCoords = [];
  let displayCoords = [];
  let replayProgress = 1;
  let boundsApplied = false;

  ${MAP_HELPERS}

  function sliceCoordsByProgress(coords, progress) {
    if (!coords || coords.length < 2) return coords || [];
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped >= 1) return coords;
    const targetIndex = Math.max(1, Math.round(clamped * (coords.length - 1)));
    return coords.slice(0, targetIndex + 1);
  }

  function syncPreviewMarkers(coords, progress) {
    const start = coords && coords.length > 0 ? coords[0] : null;
    const end = coords && coords.length > 1 ? coords[coords.length - 1] : null;
    const showFinalEnd = progress >= 1;

    if (start) {
      if (!startMarker) {
        startMarker = new maplibregl.Marker({ element: createStartMarkerElement(), anchor: 'center' })
          .setLngLat(start)
          .addTo(map);
      } else {
        startMarker.setLngLat(start);
      }
    }

    if (endMarker) {
      endMarker.remove();
      endMarker = null;
    }

    if (replayMarker) {
      replayMarker.remove();
      replayMarker = null;
    }

    if (end) {
      if (showFinalEnd && (!start || end[0] !== start[0] || end[1] !== start[1])) {
        endMarker = new maplibregl.Marker({ element: createEndMarkerElement(), anchor: 'center' })
          .setLngLat(end)
          .addTo(map);
      } else if (!showFinalEnd) {
        var replayHeading = null;
        if (coords.length >= 2) {
          replayHeading = computeBearingDegrees(
            coords[coords.length - 2],
            coords[coords.length - 1]
          );
        }
        replayMarker = new maplibregl.Marker({ element: createArrowMarkerElement(replayHeading), anchor: 'center' })
          .setLngLat(end)
          .addTo(map);
      }
    }
  }

  function applyRouteGeometry(coords) {
    if (!map.isStyleLoaded() || coords.length < 2) return;

    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    if (!routeAdded) {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '${PRIMARY}', 'line-width': 4 },
      });
      routeAdded = true;
    } else if (map.getSource('route')) {
      map.getSource('route').setData(data);
    }
  }

  function applyRoute(coords) {
    pendingCoords = coords || [];
    if (pendingCoords.length < 2) return;

    displayCoords = simplifyRouteForDisplay(pendingCoords);
    const visibleCoords = sliceCoordsByProgress(displayCoords, replayProgress);
    applyRouteGeometry(visibleCoords);
    syncPreviewMarkers(visibleCoords, replayProgress);

    if (!boundsApplied && displayCoords.length >= 2) {
      boundsApplied = true;
      const lngs = displayCoords.map(c => c[0]);
      const lats = displayCoords.map(c => c[1]);
      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, { padding: 40, duration: 0 });
    }
  }

  function applyReplayProgress(progress) {
    replayProgress = Math.max(0, Math.min(1, progress));
    if (displayCoords.length >= 2) {
      const visibleCoords = sliceCoordsByProgress(displayCoords, replayProgress);
      applyRouteGeometry(visibleCoords);
      syncPreviewMarkers(visibleCoords, replayProgress);
    }
  }

  map.on('load', () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });

  window.showRoute = function(coords) {
    boundsApplied = false;
    applyRoute(coords);
  };

  window.setRouteReplayProgress = function(progress) {
    applyReplayProgress(progress);
  };

  window.setMapStyle = function(stylePayload) {
    routeAdded = false;
    startMarker = null;
    endMarker = null;
    replayMarker = null;
    boundsApplied = false;
    const style = stylePayload.type === 'url' ? stylePayload.value : stylePayload.value;
    map.setStyle(style);
    map.once('style.load', () => {
      applyRoute(pendingCoords);
    });
  };
</script>
</body>
</html>`;
}

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  replayProgress?: number;
  style?: object;
};

/** Read-only route preview for Expo Go (submission confirmation / session detail). */
export function SessionRouteMapPreviewWebView({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayProgress = 1,
  style,
}: Props) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.showRoute(${JSON.stringify(routeCoordinates)}); window.setRouteReplayProgress(${replayProgress}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushReplayUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.setRouteReplayProgress(${replayProgress}); true;`;
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
  }, [routeCoordinates]);

  useEffect(() => {
    pushReplayUpdate();
  }, [replayProgress]);

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
