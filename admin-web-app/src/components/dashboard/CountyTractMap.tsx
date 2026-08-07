"use client";

/**
 * Real basemap + real census-tract boundaries for the heatmap's county drill-down —
 * replaces the old schematic Cook-County-only tile shapes. Tracts partition an entire
 * county (suburbs and unincorporated areas included), so this works for any US county,
 * not just Chicago proper.
 */
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Position } from "geojson";
import { VOYAGER_RASTER_STYLE } from "@/lib/maplibre-basemap";
import { heatFill, type GeoUnitStats } from "@/lib/us-heatmap";
import type { TractFeature } from "@/lib/census-tracts";
import { ExpandIcon, CollapseIcon } from "@/components/ui/Icons";

const SOURCE_ID = "county-tracts";
const FILL_LAYER_ID = "county-tracts-fill";
const LINE_LAYER_ID = "county-tracts-outline";
const SELECTED_LINE_LAYER_ID = "county-tracts-selected-outline";

type Props = {
  tracts: FeatureCollection;
  statsById: Map<string, GeoUnitStats>;
  maxCount: number;
  hoveredId: string | null;
  onHoverId: (id: string | null) => void;
  onSelectTract: (id: string, name: string) => void;
};

/** Flattens Polygon/MultiPolygon coordinates to a flat point list for bounds fitting. */
function collectPositions(coords: unknown, out: Position[]): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number") {
    out.push(coords as Position);
    return;
  }
  for (const child of coords as unknown[]) {
    collectPositions(child, out);
  }
}

function boundsOf(fc: FeatureCollection): maplibregl.LngLatBoundsLike | null {
  const points: Position[] = [];
  for (const f of fc.features) {
    if (f.geometry && "coordinates" in f.geometry) {
      collectPositions(f.geometry.coordinates, points);
    }
  }
  if (points.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Injects fill color + count into each tract's properties so MapLibre can read them directly. */
function toStyledCollection(
  tracts: FeatureCollection,
  statsById: Map<string, GeoUnitStats>,
  maxCount: number,
): FeatureCollection {
  return {
    ...tracts,
    features: tracts.features.map((raw) => {
      const f = raw as TractFeature;
      const geoid = f.properties?.GEOID ?? "";
      const stat = statsById.get(geoid);
      const count = stat?.sessionCount ?? 0;
      return {
        ...f,
        id: geoid,
        properties: {
          ...f.properties,
          sessionCount: count,
          fillColor: heatFill(maxCount > 0 ? count / maxCount : 0),
        },
      };
    }),
  };
}

export function CountyTractMap({ tracts, statsById, maxCount, hoveredId, onHoverId, onSelectTract }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Mount once; source/layer data is kept in sync by the effect below.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: VOYAGER_RASTER_STYLE,
      bounds: boundsOf(tracts) ?? undefined,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toStyledCollection(tracts, statsById, maxCount),
      });
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": ["get", "fillColor"], "fill-opacity": 0.75 },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": "#ffffff", "line-width": 0.75 },
      });
      map.addLayer({
        id: SELECTED_LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": "#1c1b1b", "line-width": 2 },
        filter: ["==", ["get", "GEOID"], ""],
      });

      map.on("mousemove", FILL_LAYER_ID, (e) => {
        const id = e.features?.[0]?.properties?.GEOID as string | undefined;
        if (id && id !== hoveredIdRef.current) {
          hoveredIdRef.current = id;
          onHoverId(id);
        }
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FILL_LAYER_ID, () => {
        hoveredIdRef.current = null;
        onHoverId(null);
        map.getCanvas().style.cursor = "";
      });
      map.on("click", FILL_LAYER_ID, (e) => {
        const props = e.features?.[0]?.properties;
        if (props?.GEOID) onSelectTract(props.GEOID as string, (props.NAME as string) ?? props.GEOID);
      });
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Boundaries only change when the drilled-into county changes — the map is
    // recreated wholesale via `key` on the parent element in that case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep fill colors in sync as stats/hover/selection change without re-mounting the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toStyledCollection(tracts, statsById, maxCount));
    }
    if (map.getLayer(SELECTED_LINE_LAYER_ID)) {
      map.setFilter(SELECTED_LINE_LAYER_ID, ["==", ["get", "GEOID"], hoveredId ?? ""]);
    }
  }, [tracts, statsById, maxCount, hoveredId]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  return (
    <div
      className={fullscreen ? "fixed inset-0 z-[100] bg-bg-app flex flex-col" : "relative"}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? "Full screen county map" : undefined}
    >
      {fullscreen && (
        <header className="shrink-0 flex items-center justify-between gap-md px-lg py-md border-b border-border-outline bg-bg-surface">
          <p className="font-heading text-[20px] leading-[28px] text-text-primary">Full screen map</p>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="inline-flex h-11 items-center gap-sm px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Exit full screen"
          >
            <CollapseIcon className="w-4 h-4" />
            Exit full screen
          </button>
        </header>
      )}
      <div className={fullscreen ? "relative flex-1 min-h-0" : "relative"}>
        <div
          ref={containerRef}
          role="img"
          aria-label="County map shaded by census tract session activity"
          className={
            fullscreen
              ? "absolute inset-0 [&_.maplibregl-canvas]:!outline-none"
              : "h-[320px] sm:h-[400px] w-full rounded-sm overflow-hidden border border-border-outline [&_.maplibregl-canvas]:!outline-none"
          }
        />
        {!fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute top-sm right-sm z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-outline bg-bg-app/95 text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary shadow-sm"
            aria-label="Enter full screen"
            aria-pressed="false"
          >
            <ExpandIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
