import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { colors } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

const PRIMARY = colors.primary;
const CARTO_VOYAGER = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

function buildHtml(coordinate: MapCoordinate): string {
  const { latitude, longitude } = coordinate;
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}
  .pin {
    width: 22px;
    height: 22px;
    border-radius: 11px;
    background: ${PRIMARY};
    border: 2px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pin-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: #ffffff;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: ${JSON.stringify(CARTO_VOYAGER)},
    center: [${longitude}, ${latitude}],
    zoom: 14,
    interactive: false,
    attributionControl: false,
  });
  const mapResizeObserver = new ResizeObserver(() => { map.resize(); });
  mapResizeObserver.observe(document.getElementById('map'));

  const el = document.createElement('div');
  el.className = 'pin';
  const dot = document.createElement('div');
  dot.className = 'pin-dot';
  el.appendChild(dot);
  new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat([${longitude}, ${latitude}])
    .addTo(map);

  map.on('load', () => {
    map.resize();
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  });
</script>
</body>
</html>`;
}

/**
 * Expo Go live location preview — MapLibre GL JS in a WebView with a brand pin.
 * Gestures are disabled; the native overlay opens Apple/Google Maps on tap.
 */
export function EventLocationMapWebView({ address, coordinate, onPress }: Props) {
  return (
    <View style={s.mapWrap}>
      <WebView
        style={s.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        pointerEvents="none"
        source={{ html: buildHtml(coordinate) }}
      />
      <AnimatedPressable
        scaleTo={1}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${address} in Maps`}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  mapWrap: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.chipSelectedBg,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.chipSelectedBg,
  },
});
