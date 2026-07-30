"use client";

/**
 * MapLibre walking-path map for session review — Carto Voyager raster tiles
 * (same approach as `EventLocationMap`) with the GPS polyline from
 * `sessions.route`. Pan/zoom enabled so admins can inspect the trail.
 */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { routeBounds, type RouteCoordinate } from "@/lib/session-route";

const PRIMARY = "#009540";
const END = "#ba1a1a";
const SOURCE_ID = "session-route";
const LAYER_ID = "session-route-line";

const VOYAGER_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    voyager: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap",
    },
  },
  layers: [{ id: "voyager", type: "raster", source: "voyager" }],
};

function createDot(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "12px";
  el.style.height = "12px";
  el.style.borderRadius = "50%";
  el.style.background = color;
  el.style.border = "2px solid #ffffff";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.35)";
  el.style.pointerEvents = "none";
  return el;
}

type Props = {
  route: RouteCoordinate[];
  className?: string;
};

export function SessionWalkingPathMap({ route, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Stabilize effect when parent re-renders with the same polyline.
  const routeKey = route.map(([lng, lat]) => `${lng},${lat}`).join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || route.length === 0) return;

    const map = new maplibregl.Map({
      container,
      style: VOYAGER_RASTER_STYLE,
      center: route[0],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const markers: maplibregl.Marker[] = [];
    markers.push(
      new maplibregl.Marker({ element: createDot(PRIMARY) }).setLngLat(route[0]).addTo(map),
    );
    if (route.length > 1) {
      markers.push(
        new maplibregl.Marker({ element: createDot(END) })
          .setLngLat(route[route.length - 1])
          .addTo(map),
      );
    }

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    map.on("load", () => {
      map.resize();
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route,
          },
        },
      });
      map.addLayer({
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": PRIMARY,
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });

      const bounds = routeBounds(route);
      if (bounds) {
        map.fitBounds([bounds.sw, bounds.ne], {
          padding: 48,
          maxZoom: 16,
          duration: 0,
        });
      }
    });

    return () => {
      resizeObserver.disconnect();
      for (const m of markers) m.remove();
      map.remove();
    };
    // routeKey captures coordinate identity; route is closed over from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable key
  }, [routeKey]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-sm border border-border-outline bg-bg-surface-elevated aspect-[16/9] ${className ?? ""}`}
      role="img"
      aria-label={`Walking path with ${route.length} GPS points`}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full [&_.maplibregl-canvas]:!outline-none"
      />
    </div>
  );
}
