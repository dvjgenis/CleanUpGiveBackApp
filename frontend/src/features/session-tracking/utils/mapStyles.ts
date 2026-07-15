import type { StyleSpecification } from '@maplibre/maplibre-react-native';

export type MapLayerType = 'standard' | 'streets' | 'satellite' | 'hybrid';

export const DEFAULT_MAP_LAYER: MapLayerType = 'standard';

export const MAP_LAYER_OPTIONS: ReadonlyArray<{ id: MapLayerType; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'streets', label: 'Streets' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'hybrid', label: 'Hybrid' },
] as const;

const CARTO_POSITRON = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const CARTO_VOYAGER = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const ESRI_WORLD_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const ESRI_WORLD_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export const SATELLITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_WORLD_IMAGERY],
      tileSize: 256,
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
      attribution: 'Esri',
    },
    'esri-labels': {
      type: 'raster',
      tiles: [ESRI_WORLD_LABELS],
      tileSize: 256,
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
    case 'streets':
      return { type: 'url', value: CARTO_VOYAGER };
    case 'satellite':
      return { type: 'json', value: SATELLITE_MAP_STYLE };
    case 'hybrid':
      return { type: 'json', value: HYBRID_MAP_STYLE };
    case 'standard':
    default:
      return { type: 'url', value: CARTO_POSITRON };
  }
}

export function getNativeMapStyle(layer: MapLayerType): string | StyleSpecification {
  const payload = getMapStylePayload(layer);
  return payload.type === 'url' ? payload.value : payload.value;
}

export function getMapLayerLabel(layer: MapLayerType): string {
  return MAP_LAYER_OPTIONS.find((option) => option.id === layer)?.label ?? 'Standard';
}
