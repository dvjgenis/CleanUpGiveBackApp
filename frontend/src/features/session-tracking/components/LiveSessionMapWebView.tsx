import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useLiveSession } from '../liveSessionStore';
import { useEffectiveMapTheme, type MapBasemapTheme } from '../mapThemeStore';
import { colors, radius, textStyles } from '../tokens';
import { getMapStylePayload, type MapLayerType } from '../utils/mapStyles';
import { buildWebViewMapHelpers } from '../utils/webViewMapHelpers';
import { appendLiveTipToDisplayRoute } from '../utils/routeFiltering';
import { MapInteractionContainer } from './MapInteractionContainer';

const PRIMARY = colors.primary;
/** Start-pin color unused on the live tracker (no start marker — matches native).
 * Still required by `buildWebViewMapHelpers` for shared preview helpers. */
const MAP_HELPERS = buildWebViewMapHelpers(PRIMARY, colors.textTertiary);
/** Raster layers worth prefetching in the background — 'standard' is a
 * vector style URL (not raster tiles), so it's not a prefetch candidate. */
const OTHER_PREFETCHABLE_LAYERS: MapLayerType[] = ['satellite', 'hybrid'];
/** Gives the initial route/marker push priority for bandwidth before
 * kicking off background tile prefetching for other layers. */
const PREFETCH_DELAY_MS = 2500;

function buildHtml(initialCenter: [number, number] | null, theme: MapBasemapTheme) {
  const center = initialCenter ? JSON.stringify(initialCenter) : '[-98.5795,39.8283]';
  const zoom = initialCenter ? 15 : 3;
  const initialStyle = getMapStylePayload('standard', theme);
  const initialStyleJs =
    initialStyle.type === 'url'
      ? JSON.stringify(initialStyle.value)
      : JSON.stringify(initialStyle.value);
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
    style: ${initialStyleJs},
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
  let currentMarker = null;
  let currentMarkerElement = null;
  // Pre-seeded when we have a real GPS fix at HTML-bake time; false means the
  // first updateRoute call will snap the viewport to the user's actual location.
  let hasInitialCentered = ${initialCenter ? 'true' : 'false'};
  let lastRecenterToken = 0;
  let pendingCoords = [];
  let pendingCurrent = null;
  let pendingHeading = null;
  let pendingRecenterToken = 0;
  let pendingFollowEnabled = false;

  ${MAP_HELPERS}

  // Live tracker shows only the current-position pin (matches native —
  // LiveSessionMapNative). A gray start pin at coords[0] sits on top of /
  // beside the green tip whenever the walk is short, which reads as the
  // marker "turning black" after a style swap re-syncs overlays.
  function syncMarkers(current, heading) {
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

  function applyRouteOverlay(coords, current, heading, recenterToken, followEnabled, forceApply) {
    pendingCoords = coords || [];
    pendingCurrent = current;
    pendingHeading = heading;
    pendingRecenterToken = recenterToken;
    pendingFollowEnabled = followEnabled;
    // 'style.load' firing (see window.setMapStyle below) only means the new
    // style document has been parsed and applied — isStyleLoaded() can still
    // read false for a beat afterward while sources/tiles catch up. Gating
    // on it there would skip syncMarkers() and leave the just-removed
    // current marker permanently gone until the next GPS fix. The caller
    // passes forceApply=true once it already knows from the event that
    // re-syncing is safe; the regular GPS-driven update path still uses
    // this guard to avoid touching the map before it's ready at all.
    if (!forceApply && !map.isStyleLoaded()) return;

    const displayCoords = pendingCoords;
    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: displayCoords } };
    if (!routeAdded && displayCoords.length >= 2) {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '${PRIMARY}', 'line-width': 4, 'line-join': 'round', 'line-cap': 'round' },
      });
      routeAdded = true;
    } else if (routeAdded && map.getSource('route')) {
      map.getSource('route').setData(data);
    }

    syncMarkers(pendingCurrent, pendingHeading);

    if (pendingCurrent && pendingCurrent.length === 2) {
      const recenterRequested = recenterToken !== lastRecenterToken;
      if (recenterRequested) {
        lastRecenterToken = recenterToken;
        map.flyTo({ center: pendingCurrent, zoom: 15, duration: 900 });
        return;
      }
      if (pendingFollowEnabled) {
        map.easeTo({ center: pendingCurrent, duration: 450 });
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
    // Keep existing marker DOM elements attached during the style swap so the
    // pin never disappears. MapLibre may detach custom layers on setStyle, but
    // Marker DOM nodes survive — we only re-sync overlays once the new style
    // finishes loading.
    const style = stylePayload.type === 'url' ? stylePayload.value : stylePayload.value;
    map.setStyle(style);
    map.once('style.load', () => {
      applyRouteOverlay(
        pendingCoords,
        pendingCurrent,
        pendingHeading,
        pendingRecenterToken,
        pendingFollowEnabled,
        true,
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
    displayRouteCoordinates,
    displayCoordinate,
    currentCoordinate,
    currentHeading,
    mapRecenterToken,
    mapFollowEnabled,
    mapLayer,
  } = useLiveSession();
  const mapTheme = useEffectiveMapTheme();
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const baseRouteForMap =
    displayRouteCoordinates.length >= 2 ? displayRouteCoordinates : routeCoordinates;
  const routeForMap = useMemo(
    () => appendLiveTipToDisplayRoute(baseRouteForMap, displayCoordinate),
    [baseRouteForMap, displayCoordinate],
  );

  // Only bake HTML once we have a real fix — never start at the US overview.
  const seedCenter =
    (displayCoordinate as [number, number] | null) ??
    (currentCoordinate as [number, number] | null) ??
    (routeCoordinates[0] as [number, number] | undefined) ??
    null;
  const htmlRef = useRef<string | null>(null);
  if (seedCenter && htmlRef.current === null) {
    htmlRef.current = buildHtml(seedCenter, mapTheme);
  }

  const pushRouteUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const script = `window.updateRoute(${JSON.stringify(routeForMap)}, ${JSON.stringify(displayCoordinate)}, ${currentHeading ?? 'null'}, ${mapRecenterToken}, ${mapFollowEnabled}); true;`;
    webRef.current.injectJavaScript(script);
  };

  const pushStyleUpdate = () => {
    if (!readyRef.current || !webRef.current) {
      return;
    }

    const stylePayload = getMapStylePayload(mapLayer, mapTheme);
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

    const payloads = otherLayers.map((layer) => getMapStylePayload(layer, mapTheme));
    const script = `window.prefetchLayerTiles(${JSON.stringify(payloads)}); true;`;
    webRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    pushRouteUpdate();
  }, [routeForMap, displayCoordinate, currentHeading, mapRecenterToken, mapFollowEnabled]);

  useEffect(() => {
    pushStyleUpdate();
  }, [mapLayer, mapTheme]);

  if (!seedCenter || !htmlRef.current) {
    return (
      <MapInteractionContainer style={[styles.container, style]}>
        <View style={styles.waiting}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[textStyles.bodySmall, styles.waitingText]}>
            Getting precise location…
          </Text>
        </View>
      </MapInteractionContainer>
    );
  }

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
        source={{ html: htmlRef.current }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'ready') {
            readyRef.current = true;
            // Re-push style when HTML was baked before a theme/layer change, or
            // when not on the default Standard light basemap.
            if (mapLayer !== 'standard' || mapTheme !== 'light') {
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
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.bgSurface,
  },
  waitingText: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
