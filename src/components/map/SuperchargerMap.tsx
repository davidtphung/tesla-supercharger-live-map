"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
  type Popup,
} from "maplibre-gl";
import type { StationRecord } from "@/lib/schema/station";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { MAP_STYLES } from "@/lib/theme/tokens";
import { useThemeStore } from "@/store/theme";
import { markerColor, congestionHeatColor } from "@/lib/utils/colors";

function stationsToGeoJSON(
  stations: StationRecord[],
  emphasizeEnergy: boolean
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      id: s.station_id,
      geometry: {
        type: "Point",
        coordinates: [s.longitude, s.latitude],
      },
      properties: {
        station_id: s.station_id,
        name: s.station_name,
        color: markerColor(
          s.occupancy_status,
          s.energy_portfolio_type,
          emphasizeEnergy
        ),
        available: s.stall_available,
        occupied: s.stall_occupied,
        total: s.stall_total,
        congestion: s.congestion_score,
        power: s.max_power_kw,
        heat: congestionHeatColor(s.congestion_score),
        radius: 4 + Math.min(14, s.congestion_score / 8),
      },
    })),
  };
}

export function SuperchargerMap({
  stations,
  selectedStationId,
  showHeatmap,
  emphasizeEnergy,
  onSelectStation,
}: {
  stations: StationRecord[];
  selectedStationId: string | null;
  showHeatmap: boolean;
  emphasizeEnergy: boolean;
  onSelectStation: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const loadedThemeRef = useRef<"dark" | "light" | null>(null);
  const stationsRef = useRef(stations);
  const emphasizeEnergyRef = useRef(emphasizeEnergy);
  const showHeatmapRef = useRef(showHeatmap);
  const onSelectRef = useRef(onSelectStation);
  const clickHandlerRef = useRef<((e: MapLayerMouseEvent) => void) | null>(null);
  const enterHandlerRef = useRef<(() => void) | null>(null);
  const leaveHandlerRef = useRef<(() => void) | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const resolved = useThemeStore((s) => s.resolved);
  const themeRef = useRef(resolved);

  themeRef.current = resolved;
  stationsRef.current = stations;
  emphasizeEnergyRef.current = emphasizeEnergy;
  showHeatmapRef.current = showHeatmap;
  onSelectRef.current = onSelectStation;

  const addStationLayers = useCallback((map: Map, theme: "dark" | "light") => {
    if (map.getSource("stations")) {
      if (map.getLayer("stations-points")) map.removeLayer("stations-points");
      if (map.getLayer("stations-glow")) map.removeLayer("stations-glow");
      if (map.getLayer("stations-heat")) map.removeLayer("stations-heat");
      map.removeSource("stations");
    }

    map.addSource("stations", {
      type: "geojson",
      data: stationsToGeoJSON(stationsRef.current, emphasizeEnergyRef.current),
    });

    map.addLayer({
      id: "stations-heat",
      type: "circle",
      source: "stations",
      paint: {
        "circle-radius": ["get", "radius"],
        "circle-color": ["get", "heat"],
        "circle-opacity": 0.55,
        "circle-blur": 0.8,
      },
      layout: {
        visibility: showHeatmapRef.current ? "visible" : "none",
      },
    });

    map.addLayer({
      id: "stations-glow",
      type: "circle",
      source: "stations",
      paint: {
        "circle-radius": 10,
        "circle-color": ["get", "color"],
        "circle-opacity": 0.18,
        "circle-blur": 0.6,
      },
      layout: {
        visibility: showHeatmapRef.current ? "none" : "visible",
      },
    });

    map.addLayer({
      id: "stations-points",
      type: "circle",
      source: "stations",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          3,
          8,
          6,
          12,
          8,
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-color": theme === "dark" ? "#0f172a" : "#ffffff",
        "circle-stroke-width": 1.2,
        "circle-opacity": 0.95,
      },
      layout: {
        visibility: showHeatmapRef.current ? "none" : "visible",
      },
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[themeRef.current],
      center: [-98.5795, 39.8283],
      zoom: 3.2,
      attributionControl: {},
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    const bindStationInteractions = () => {
      if (clickHandlerRef.current) {
        map.off("click", "stations-points", clickHandlerRef.current);
      }
      if (enterHandlerRef.current) {
        map.off("mouseenter", "stations-points", enterHandlerRef.current);
      }
      if (leaveHandlerRef.current) {
        map.off("mouseleave", "stations-points", leaveHandlerRef.current);
      }

      const onClick = (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;
        const props = feature.properties;
        const id = props.station_id as string | undefined;
        if (!id) return;
        onSelectRef.current(id);

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 12,
        })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div role="status">
              <strong style="font-weight:600">${props.name}</strong><br/>
              <span style="font-family:monospace;font-size:12px;opacity:0.7">${props.available}/${props.total} available · ${props.power} kW</span>
            </div>`
          )
          .addTo(map);
      };

      const onEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        map.getCanvas().style.cursor = "";
      };

      clickHandlerRef.current = onClick;
      enterHandlerRef.current = onEnter;
      leaveHandlerRef.current = onLeave;

      map.on("click", "stations-points", onClick);
      map.on("mouseenter", "stations-points", onEnter);
      map.on("mouseleave", "stations-points", onLeave);
    };

    const onStyleReady = () => {
      addStationLayers(map, themeRef.current);
      loadedThemeRef.current = themeRef.current;
      bindStationInteractions();
    };

    map.on("load", onStyleReady);
    map.on("style.load", onStyleReady);

    mapRef.current = map;
    loadedThemeRef.current = themeRef.current;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      loadedThemeRef.current = null;
    };
  }, [addStationLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loadedThemeRef.current === resolved) return;

    const swapStyle = () => map.setStyle(MAP_STYLES[resolved]);
    if (map.isStyleLoaded()) {
      swapStyle();
    } else {
      map.once("load", swapStyle);
    }
  }, [resolved]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("stations") as GeoJSONSource | undefined;
    source?.setData(stationsToGeoJSON(stations, emphasizeEnergy));
  }, [stations, emphasizeEnergy]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    map.setLayoutProperty(
      "stations-heat",
      "visibility",
      showHeatmap ? "visible" : "none"
    );
    map.setLayoutProperty(
      "stations-points",
      "visibility",
      showHeatmap ? "none" : "visible"
    );
    map.setLayoutProperty(
      "stations-glow",
      "visibility",
      showHeatmap ? "none" : "visible"
    );
  }, [showHeatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !selectedStationId) return;
    const station = stations.find((s) => s.station_id === selectedStationId);
    if (!station) return;

    if (reducedMotion) {
      map.jumpTo({
        center: [station.longitude, station.latitude],
        zoom: Math.max(map.getZoom(), 9),
      });
    } else {
      map.flyTo({
        center: [station.longitude, station.latitude],
        zoom: Math.max(map.getZoom(), 9),
        speed: 1.2,
      });
    }
  }, [selectedStationId, stations, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full globe-canvas"
      role="application"
      aria-label="Interactive map of Tesla Supercharger stations. Tap or click a marker for details."
    />
  );
}