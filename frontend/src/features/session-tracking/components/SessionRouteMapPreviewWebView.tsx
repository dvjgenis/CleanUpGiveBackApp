import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { colors, radius } from '../tokens';
import {
  DEFAULT_MAP_LAYER,
  getMapStylePayload,
  getReplayStartMarkerColors,
  type MapLayerType,
} from '../utils/mapStyles';
import type { RouteCoordinate } from '../utils/geo';
import { buildWebViewMapHelpers } from '../utils/webViewMapHelpers';
import { MapInteractionContainer } from './MapInteractionContainer';

const PRIMARY = colors.primary;

/** Builds the WebView HTML with the chosen basemap already set as the MapLibre
 * `style` option — avoids a post-load `setStyle` that races the route replay
 * and would flash Standard before Hybrid/Satellite. */
function buildHtml(mapLayer: MapLayerType) {
  const stylePayload = getMapStylePayload(mapLayer);
  // URL string or inline StyleSpecification JSON — both are valid MapLibre styles.
  const styleLiteral = JSON.stringify(stylePayload.value);
  const startColors = getReplayStartMarkerColors(mapLayer);
  const mapHelpers = buildWebViewMapHelpers(PRIMARY, startColors.fill, startColors.border);
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
    style: ${styleLiteral},
    center: [-98, 39],
    zoom: 3,
    attributionControl: false,
  });
  // See LiveSessionMapWebView.tsx — MapLibre caches canvas size at creation
  // time, so keep it in sync with the real container box or markers drift
  // from their rendered position after layout/orientation changes.
  const mapResizeObserver = new ResizeObserver(() => { map.resize(); });
  mapResizeObserver.observe(document.getElementById('map'));
  window.addEventListener('orientationchange', () => { setTimeout(() => map.resize(), 100); });
  let routeAdded = false;
  let startMarker = null;
  let endMarker = null;
  let tipMarker = null;
  let replayFrame = null;
  let hasReplayed = false;
  let pendingCoords = [];

  ${mapHelpers}

  applyStartMarkerColors(${JSON.stringify(startColors.fill)}, ${JSON.stringify(startColors.border)});

  function totalRouteDistanceMeters(coords) {
    let total = 0;
    for (let i = 1; i < coords.length; i += 1) {
      total += deltaMetersBetween(coords[i - 1], coords[i]);
    }
    return total;
  }

  function pointAtDistance(coords, targetMeters) {
    if (targetMeters <= 0) return { point: coords[0], index: 0 };
    let traveled = 0;
    for (let i = 1; i < coords.length; i += 1) {
      const segmentMeters = deltaMetersBetween(coords[i - 1], coords[i]);
      if (traveled + segmentMeters >= targetMeters) {
        const remaining = targetMeters - traveled;
        const t = segmentMeters === 0 ? 0 : remaining / segmentMeters;
        const point = [
          coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t,
          coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t,
        ];
        return { point, index: i };
      }
      traveled += segmentMeters;
    }
    return { point: coords[coords.length - 1], index: coords.length - 1 };
  }

  function ensureRouteLayer() {
    if (routeAdded) return;
    map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '${PRIMARY}', 'line-width': 4 },
    });
    routeAdded = true;
  }

  function fitToRouteBounds(displayCoords) {
    const lngs = displayCoords.map(c => c[0]);
    const lats = displayCoords.map(c => c[1]);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 40, duration: 0 });
  }

  function setRouteData(coordinates) {
    const source = map.getSource('route');
    if (source) {
      source.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
    }
  }

  function cancelReplay() {
    if (replayFrame != null) {
      cancelAnimationFrame(replayFrame);
      replayFrame = null;
    }
    if (tipMarker) {
      tipMarker.remove();
      tipMarker = null;
    }
  }

  function syncPreviewMarkers(coords) {
    const start = coords && coords.length > 0 ? coords[0] : null;
    const end = coords && coords.length > 1 ? coords[coords.length - 1] : null;

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

    if (end && (!start || end[0] !== start[0] || end[1] !== start[1])) {
      endMarker = new maplibregl.Marker({ element: createEndMarkerElement(), anchor: 'center' })
        .setLngLat(end)
        .addTo(map);
    }
  }

  function applyRoute(coords) {
    pendingCoords = coords || [];
    if (!map.isStyleLoaded() || pendingCoords.length < 2) return;

    const displayCoords = simplifyRouteForDisplay(pendingCoords);
    const wasRouteAdded = routeAdded;
    ensureRouteLayer();
    setRouteData(displayCoords);
    if (!wasRouteAdded) {
      fitToRouteBounds(displayCoords);
    }

    syncPreviewMarkers(pendingCoords);
  }

  function finishReplay(coords) {
    cancelReplay();
    hasReplayed = true;
    applyRoute(coords);
  }

  function runReplay(coords) {
    pendingCoords = coords || [];
    cancelReplay();
    if (!map.isStyleLoaded() || pendingCoords.length < 2) return;

    const displayCoords = simplifyRouteForDisplay(pendingCoords);
    if (displayCoords.length < 2) {
      applyRoute(coords);
      return;
    }

    const wasRouteAdded = routeAdded;
    ensureRouteLayer();
    setRouteData([displayCoords[0]]);
    if (!wasRouteAdded) {
      fitToRouteBounds(displayCoords);
    }

    if (!startMarker) {
      startMarker = new maplibregl.Marker({ element: createStartMarkerElement(), anchor: 'center' })
        .setLngLat(displayCoords[0])
        .addTo(map);
    } else {
      startMarker.setLngLat(displayCoords[0]);
    }
    if (endMarker) {
      endMarker.remove();
      endMarker = null;
    }

    const totalMeters = totalRouteDistanceMeters(displayCoords);
    if (totalMeters <= 0) {
      finishReplay(coords);
      return;
    }
    const duration = Math.max(1800, Math.min(3500, 1800 + totalMeters * 1.5));

    tipMarker = new maplibregl.Marker({ element: createEndMarkerElement(), anchor: 'center' })
      .setLngLat(displayCoords[0])
      .addTo(map);

    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const result = pointAtDistance(displayCoords, t * totalMeters);
      const partialCoords = displayCoords.slice(0, result.index).concat([result.point]);
      setRouteData(partialCoords);
      if (tipMarker) {
        tipMarker.setLngLat(result.point);
      }

      if (t < 1) {
        replayFrame = requestAnimationFrame(step);
      } else {
        finishReplay(coords);
      }
    }

    replayFrame = requestAnimationFrame(step);
  }

  map.on('load', () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });

  window.showRoute = function(coords) {
    cancelReplay();
    applyRoute(coords);
  };

  window.replayRoute = function(coords) {
    if (hasReplayed) {
      applyRoute(coords);
      return;
    }
    runReplay(coords);
  };

  window.setMapStyle = function(stylePayload, startFill, startBorder) {
    cancelReplay();
    routeAdded = false;
    if (startMarker) { startMarker.remove(); startMarker = null; }
    if (endMarker) { endMarker.remove(); endMarker = null; }
    if (tipMarker) { tipMarker.remove(); tipMarker = null; }
    applyStartMarkerColors(startFill, startBorder);
    const style = stylePayload.type === 'url' ? stylePayload.value : stylePayload.value;
    map.setStyle(style);
    map.once('style.load', () => {
      // Style swaps from the layer picker always settle into the static
      // route — replay already ran (or will be re-triggered by React when
      // appropriate). Don't start a new animation mid-swap.
      applyRoute(pendingCoords);
      if (startMarker) {
        paintStartMarkerElement(startMarker.getElement());
      }
      map.resize();
      map.triggerRepaint();
    });
  };
</script>
</body>
</html>`;
}

type Props = {
  routeCoordinates: RouteCoordinate[];
  mapLayer?: MapLayerType;
  /** Animate the route drawing once (grow line + tip marker) instead of showing it fully drawn. */
  replayOnce?: boolean;
  style?: object;
};

/** Read-only route preview for Expo Go (submission confirmation / session detail). */
export function SessionRouteMapPreviewWebView({
  routeCoordinates,
  mapLayer = DEFAULT_MAP_LAYER,
  replayOnce = false,
  style,
}: Props) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const initialMapLayerRef = useRef(mapLayer);
  const appliedMapLayerRef = useRef(mapLayer);
  const reducedMotion = useReducedMotion();
  const shouldReplay = replayOnce && !reducedMotion;

  // Capture basemap into the HTML at first mount so Hybrid/Satellite open
  // without a post-load style swap (which races and cancels route replay).
  const htmlRef = useRef<string | null>(null);
  if (htmlRef.current === null) {
    htmlRef.current = buildHtml(initialMapLayerRef.current);
  }

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const fn = shouldReplay ? 'replayRoute' : 'showRoute';
    const script = `window.${fn}(${JSON.stringify(routeCoordinates)}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushStyleUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    if (appliedMapLayerRef.current === mapLayer) {
      return;
    }

    appliedMapLayerRef.current = mapLayer;
    const stylePayload = getMapStylePayload(mapLayer);
    const startColors = getReplayStartMarkerColors(mapLayer);
    const script = `window.setMapStyle(${JSON.stringify(stylePayload)}, ${JSON.stringify(startColors.fill)}, ${JSON.stringify(startColors.border)}); true;`;
    webRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    pushRouteUpdate();
  }, [routeCoordinates, shouldReplay]);

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
