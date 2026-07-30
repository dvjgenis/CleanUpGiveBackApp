"use client";

/**
 * Web port of mobile `EventLocationMapWebView` — MapLibre GL JS + Carto Voyager
 * basemap with a brand pin. Gestures are off; the whole map opens Google Maps.
 */
import { useMemo } from "react";

const PRIMARY = "#009540";
const CARTO_VOYAGER = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export type EventMapCoordinate = {
  latitude: number;
  longitude: number;
};

type Props = {
  address: string;
  coordinate: EventMapCoordinate;
  className?: string;
};

function buildHtml(coordinate: EventMapCoordinate): string {
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
    width: 32px;
    height: 40px;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
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
  el.innerHTML = '<svg width="32" height="40" viewBox="0 0 32 40" fill="none">' +
    '<path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="${PRIMARY}"/>' +
    '<circle cx="16" cy="16" r="6" fill="#ffffff"/>' +
    '</svg>';
  new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([${longitude}, ${latitude}])
    .addTo(map);

  map.on('load', () => { map.resize(); });
</script>
</body>
</html>`;
}

function mapsUrl(coordinate: EventMapCoordinate): string {
  const { latitude, longitude } = coordinate;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function EventLocationMap({ address, coordinate, className }: Props) {
  const srcDoc = useMemo(
    () => buildHtml(coordinate),
    [coordinate.latitude, coordinate.longitude],
  );
  const href = mapsUrl(coordinate);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${address} in Maps`}
      className={`relative block w-full overflow-hidden rounded-md border border-border-outline bg-bg-surface-elevated aspect-[382/203] ${className ?? ""}`}
    >
      <iframe
        title={`Map of ${address}`}
        srcDoc={srcDoc}
        className="absolute inset-0 h-full w-full border-0 pointer-events-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </a>
  );
}
