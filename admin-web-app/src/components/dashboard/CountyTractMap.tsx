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
import { formatTractName, type TractFeature } from "@/lib/census-tracts";
import { PlaceSearchField } from "@/components/dashboard/PlaceSearchField";
import { ExpandIcon, CollapseIcon } from "@/components/ui/Icons";
import type { PlaceSelection } from "@/lib/google-places";

const SOURCE_ID = "county-tracts";
const FILL_LAYER_ID = "county-tracts-fill";
const LINE_LAYER_ID = "county-tracts-outline";
const SELECTED_LINE_LAYER_ID = "county-tracts-selected-outline";

type Props = {
  tracts: FeatureCollection;
  statsById: Map<string, GeoUnitStats>;
  /** GEOID → colloquial place name once reverse-geocoded. Missing keys still show a
   *  muted tract-ID fallback on hover. */
  placeNamesById: Map<string, string>;
  maxCount: number;
  hoveredId: string | null;
  onHoverId: (id: string | null) => void;
  onSelectTract: (id: string, name: string) => void;
};

const HOVER_TEXT_RESOLVED = "#1c1b1b";
const HOVER_TEXT_FALLBACK = "#6e7a6c";

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

/** Flat `[minLng, minLat, maxLng, maxLat]` — for `boundsOf` consumers that need it unnested. */
function flatBoundsOf(fc: FeatureCollection): [number, number, number, number] | null {
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
  return [minLng, minLat, maxLng, maxLat];
}

function boundsOf(fc: FeatureCollection): maplibregl.LngLatBoundsLike | null {
  const flat = flatBoundsOf(fc);
  if (!flat) return null;
  const [minLng, minLat, maxLng, maxLat] = flat;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Injects fill color + count into each tract's properties so MapLibre can read them directly. */
function toStyledCollection(
  tracts: FeatureCollection,
  statsById: Map<string, GeoUnitStats>,
  placeNamesById: Map<string, string>,
  maxCount: number,
): FeatureCollection {
  return {
    ...tracts,
    features: tracts.features.map((raw) => {
      const f = raw as TractFeature;
      const geoid = f.properties?.GEOID ?? "";
      const stat = statsById.get(geoid);
      const count = stat?.sessionCount ?? 0;
      // Prefer reverse-geocoded colloquial names (Lincoln Park, …); fall back to a
      // cleaned census tract ID until the queue resolves that GEOID.
      const displayName =
        placeNamesById.get(geoid) ?? stat?.name ?? formatTractName(f.properties?.NAME ?? geoid);
      return {
        ...f,
        id: geoid,
        properties: {
          ...f.properties,
          sessionCount: count,
          fillColor: heatFill(maxCount > 0 ? count / maxCount : 0),
          displayName,
          isResolvedName: placeNamesById.has(geoid),
        },
      };
    }),
  };
}

export function CountyTractMap({
  tracts,
  statsById,
  placeNamesById,
  maxCount,
  hoveredId,
  onHoverId,
  onSelectTract,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const navControlRef = useRef<maplibregl.NavigationControl | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function flyToPlace(place: PlaceSelection) {
    const map = mapRef.current;
    if (!map) return;
    const go = () => map.flyTo({ center: [place.longitude, place.latitude], zoom: 14 });
    if (map.loaded()) go();
    else map.once("load", go);
  }

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

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });
    popupRef.current = popup;

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toStyledCollection(tracts, statsById, placeNamesById, maxCount),
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
        const name = e.features?.[0]?.properties?.displayName as string | undefined;
        const isResolved = e.features?.[0]?.properties?.isResolvedName as boolean | undefined;
        if (id && id !== hoveredIdRef.current) {
          hoveredIdRef.current = id;
          onHoverId(id);
        }
        if (name) {
          popup.setLngLat(e.lngLat).setText(name).addTo(map);
          // A real resolved place name reads in full-contrast text; a still-provisional
          // tract-ID fallback stays muted so it doesn't look like a confirmed name.
          const content = popup.getElement()?.querySelector<HTMLElement>(".maplibregl-popup-content");
          if (content) content.style.color = isResolved ? HOVER_TEXT_RESOLVED : HOVER_TEXT_FALLBACK;
        }
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FILL_LAYER_ID, () => {
        hoveredIdRef.current = null;
        onHoverId(null);
        popup.remove();
        map.getCanvas().style.cursor = "";
      });
      map.on("click", FILL_LAYER_ID, (e) => {
        const props = e.features?.[0]?.properties;
        if (props?.GEOID) onSelectTract(props.GEOID as string, (props.displayName as string) ?? props.GEOID);
      });
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      popup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Boundaries only change when the drilled-into county changes — the map is
    // recreated wholesale via `key` on the parent element in that case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep fill colors + hover label in sync as stats/names change without re-mounting the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toStyledCollection(tracts, statsById, placeNamesById, maxCount));
    }
    if (map.getLayer(SELECTED_LINE_LAYER_ID)) {
      map.setFilter(SELECTED_LINE_LAYER_ID, ["==", ["get", "GEOID"], hoveredId ?? ""]);
    }
    // Refresh the open popup when a name resolves while the cursor is still over a tract.
    const popup = popupRef.current;
    if (popup?.isOpen() && hoveredId) {
      const feature = tracts.features.find(
        (f) => (f as TractFeature).properties?.GEOID === hoveredId,
      ) as TractFeature | undefined;
      const displayName =
        placeNamesById.get(hoveredId) ??
        statsById.get(hoveredId)?.name ??
        formatTractName(feature?.properties?.NAME ?? hoveredId);
      popup.setText(displayName);
      const content = popup.getElement()?.querySelector<HTMLElement>(".maplibregl-popup-content");
      if (content) {
        content.style.color = placeNamesById.has(hoveredId) ? HOVER_TEXT_RESOLVED : HOVER_TEXT_FALLBACK;
      }
    }
  }, [tracts, statsById, placeNamesById, maxCount, hoveredId]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  // Zoom controls only in full screen — the small card view doesn't have room for them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (fullscreen) {
      if (!navControlRef.current) {
        navControlRef.current = new maplibregl.NavigationControl({ showCompass: false });
      }
      map.addControl(navControlRef.current, "top-right");
    } else if (navControlRef.current) {
      map.removeControl(navControlRef.current);
    }
  }, [fullscreen]);

  return (
    <div
      className={fullscreen ? "fixed inset-0 z-[100] bg-bg-app flex flex-col" : "relative"}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? "Full screen county map" : undefined}
    >
      {fullscreen && (
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-md px-lg py-md border-b border-border-outline bg-bg-surface">
          <p className="font-heading text-[20px] leading-[28px] text-text-primary shrink-0">Full screen map</p>
          <PlaceSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            onPlaceSelected={(place) => {
              flyToPlace(place);
              setSearchQuery(place.label);
            }}
            viewboxBounds={flatBoundsOf(tracts) ?? undefined}
            showSubmitButton
            className="flex-1 min-w-[220px] max-w-md"
            placeholder="Search for an address or place"
          />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="shrink-0 inline-flex h-11 items-center gap-sm px-md rounded-sm border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
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
              : "h-[320px] sm:h-[400px] w-full rounded-sm overflow-hidden border border-border-outline [&_.maplibregl-canvas]:!outline-none [&_.maplibregl-canvas]:rounded-sm [&_.maplibregl-canvas-container]:rounded-sm"
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
