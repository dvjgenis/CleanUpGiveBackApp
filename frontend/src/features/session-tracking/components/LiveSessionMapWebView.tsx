import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { useLiveSession } from '../liveSessionStore';
import { colors, radius } from '../tokens';
import { getMapStylePayload, type MapLayerType } from '../utils/mapStyles';
import { buildWebViewMapHelpers } from '../utils/webViewMapHelpers';
import { MapInteractionContainer } from './MapInteractionContainer';

const PRIMARY = colors.primary;
const START_COLOR = colors.textTertiary;
const MAP_HELPERS = buildWebViewMapHelpers(PRIMARY, START_COLOR);
/** Raster layers worth prefetching in the background — 'standard' is a
 * vector style URL (not raster tiles), so it's not a prefetch candidate. */
const OTHER_PREFETCHABLE_LAYERS: MapLayerType[] = ['satellite', 'hybrid'];
/** Gives the initial route/marker push priority for bandwidth before
 * kicking off background tile prefetching for other layers. */
const PREFETCH_DELAY_MS = 2500;

function buildHtml(initialCenter: [number, number] | null) {
  const center = initialCenter ? JSON.stringify(initialCenter) : '[-98,39]';
  const zoom = initialCenter ? 15 : 3;
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
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: ${center},
    zoom: ${zoom},
    attributionControl: false,
  });
  // MapLibre caches the canvas size at creation time and does not recompute
  // it on its own. The WebView's container settles to its final layout size
  // a beat after this script first runs, and moving/rotating the phone can
  // resize it again later — without an explicit resize(), map.project()
  // keeps using the stale size, so every marker drifts away from where it's
  // actually rendered. Keep MapLibre's internal size in sync with the real
  // container box at all times.
  const mapResizeObserver = new ResizeObserver(() => { map.resize(); });
  mapResizeObserver.observe(document.getElementById('map'));
  window.addEventListener('orientationchange', () => { setTimeout(() => map.resize(), 100); });
  let routeAdded = false;
  let startMarker = null;
  let currentMarker = null;
  let currentMarkerElement = null;
  // Pre-seeded to true when the HTML itself already starts at the user's location,
  // so the first updateRoute call doesn't double-snap the viewport.
  let hasInitialCentered = ${initialCenter ? 'true' : 'false'};
  let lastRecenterToken = 0;
  let pendingCoords = [];
  let pendingCurrent = null;
  let pendingHeading = null;
  let pendingRecenterToken = 0;
  let pendingFollowEnabled = false;

  ${MAP_HELPERS}

  function syncMarkers(coords, current, heading) {
    const start = coords && coords.length >= 2 ? coords[0] : null;
    if (start) {
      if (!startMarker) {
        startMarker = new maplibregl.Marker({ element: createStartMarkerElement(), anchor: 'center' })
          .setLngLat(start)
          .addTo(map);
      } else {
        startMarker.setLngLat(start);
      }
    } else if (startMarker) {
      startMarker.remove();
      startMarker = null;
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
    if (startMarker) { startMarker.remove(); startMarker = null; }
    if (currentMarker) { currentMarker.remove(); currentMarker = null; currentMarkerElement = null; }
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
      // A style swap with no accompanying camera move (the common case once
      // the map is already centered) leaves nothing to trigger a WebGL
      // repaint, and RN's WebView on iOS can leave the newly-added marker
      // DOM committed-but-unpainted until the next user touch forces a
      // compositing pass. map.resize() forces that repaint immediately,
      // the same way the ResizeObserver above already does for real
      // container-size changes, so the marker shows up without a tap.
      map.resize();
      map.triggerRepaint();
    });
  };

  window.prefetchLayerTiles = function(stylePayloads) {
    (stylePayloads || []).forEach(prefetchRasterStyleTiles);
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
    currentCoordinate,
    currentHeading,
    mapRecenterToken,
    mapFollowEnabled,
    mapLayer,
  } = useLiveSession();
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  // Capture the best available position at mount time so the HTML itself starts
  // centered on the user — prevents the USA-map flash on first open.
  const htmlRef = useRef<string | null>(null);
  if (htmlRef.current === null) {
    const center = displayCoordinate ?? currentCoordinate ?? routeCoordinates[0] ?? null;
    htmlRef.current = buildHtml(center as [number, number] | null);
  }

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.updateRoute(${JSON.stringify(routeCoordinates)}, ${JSON.stringify(displayCoordinate)}, ${currentHeading ?? 'null'}, ${mapRecenterToken}, ${mapFollowEnabled}); true;`;
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

  // Warm the tile cache for the layers the user hasn't picked yet — Hybrid
  // in particular layers three separate Esri raster sources at once, so
  // switching to it "cold" is noticeably slower than the CDN-backed
  // standard basemap. Fetching them quietly in the background shortly
  // after load means the actual layer switch later just repaints from
  // cache instead of waiting on the network. Delayed so it doesn't compete
  // with the initial map/route load for bandwidth.
  const prefetchOtherLayers = () => {
    if (!webRef.current) {
      return;
    }

    const otherLayers = OTHER_PREFETCHABLE_LAYERS.filter((layer) => layer !== mapLayer);
    if (otherLayers.length === 0) {
      return;
    }

    const payloads = otherLayers.map((layer) => getMapStylePayload(layer));
    const script = `window.prefetchLayerTiles(${JSON.stringify(payloads)}); true;`;
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
        source={{ html: htmlRef.current! }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'ready') {
            readyRef.current = true;
            if (mapLayer !== 'standard') {
              pushStyleUpdate();
            }
            pushRouteUpdate();
            setTimeout(prefetchOtherLayers, PREFETCH_DELAY_MS);
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
