import type { StyleSpecification } from '@maplibre/maplibre-react-native';

export type MapLayerType = 'standard' | 'satellite' | 'hybrid';

export const DEFAULT_MAP_LAYER: MapLayerType = 'standard';

export const MAP_LAYER_OPTIONS: ReadonlyArray<{ id: MapLayerType; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
] as const;

const CARTO_VOYAGER = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const ESRI_WORLD_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const ESRI_WORLD_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const ESRI_WORLD_TRANSPORTATION =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';

/**
 * Esri's tile services don't have imagery/labels for every zoom level in every
 * location. Requesting a tile past this cap returns a placeholder image with
 * "Map data not available" baked in instead of a 404, so MapLibre can't fall
 * back automatically. Capping source `maxzoom` here makes MapLibre stop
 * fetching new tiles past this level and instead over-zoom (upscale) the last
 * real tile it has, which avoids ever rendering the placeholder.
 */
const ESRI_TILE_MAX_ZOOM = 19;

export const SATELLITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_WORLD_IMAGERY],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri-imagery',
    },
  ],
};

export const HYBRID_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_WORLD_IMAGERY],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
    'esri-transportation': {
      type: 'raster',
      tiles: [ESRI_WORLD_TRANSPORTATION],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
    'esri-labels': {
      type: 'raster',
      tiles: [ESRI_WORLD_LABELS],
      tileSize: 256,
      maxzoom: ESRI_TILE_MAX_ZOOM,
      attribution: 'Esri',
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri-imagery',
    },
    {
      // Road lines + road name labels — drawn above imagery, below place/boundary labels.
      id: 'esri-transportation',
      type: 'raster',
      source: 'esri-transportation',
    },
    {
      // Place names + political boundaries — drawn last so they sit on top of road lines.
      id: 'esri-labels',
      type: 'raster',
      source: 'esri-labels',
    },
  ],
};

export type MapStylePayload =
  | { type: 'url'; value: string }
  | { type: 'json'; value: StyleSpecification };

export function getMapStylePayload(layer: MapLayerType): MapStylePayload {
  switch (layer) {
    case 'satellite':
      return { type: 'json', value: SATELLITE_MAP_STYLE };
    case 'hybrid':
      return { type: 'json', value: HYBRID_MAP_STYLE };
    case 'standard':
    default:
      return { type: 'url', value: CARTO_VOYAGER };
  }
}

export function getNativeMapStyle(layer: MapLayerType): string | StyleSpecification {
  const payload = getMapStylePayload(layer);
  return payload.type === 'url' ? payload.value : payload.value;
}

export function getMapLayerLabel(layer: MapLayerType): string {
  return MAP_LAYER_OPTIONS.find((option) => option.id === layer)?.label ?? 'Standard';
}

/**
 * Fill + border for the fixed start pin on route replay / session-detail
 * previews. Contrasts against the basemap: black on the light Standard
 * style, white on dark Satellite/Hybrid imagery.
 */
export function getReplayStartMarkerColors(layer: MapLayerType): {
  fill: string;
  border: string;
} {
  switch (layer) {
    case 'satellite':
    case 'hybrid':
      return { fill: '#ffffff', border: '#000000' };
    case 'standard':
      return { fill: '#000000', border: '#ffffff' };
    default: {
      const _exhaustive: never = layer;
      return _exhaustive;
    }
  }
}
