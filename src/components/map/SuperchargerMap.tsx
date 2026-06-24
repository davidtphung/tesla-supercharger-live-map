"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map, type Popup } from "maplibre-gl";
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
  const reducedMotion = usePrefersReducedMotion();
  const resolved = useThemeStore((s) => s.resolved);

  const addStationLayers = useCallback(
    (map: Map, theme: "dark" | "light") => {
      map.addSource("stations", {
        type: "geojson",
        data: stationsToGeoJSON([], emphasizeEnergy),
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
        layout: { visibility: showHeatmap ? "visible" : "none" },
      });

      map.addLayer({
        id: "stations-glow",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": 12,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.2,
          "circle-blur": 0.6,
        },
        layout: { visibility: showHeatmap ? "none" : "visible" },
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
            4,
            8,
            7,
            12,
            10,
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-color": theme === "dark" ? "#0a1117" : "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95,
        },
        layout: { visibility: showHeatmap ? "none" : "visible" },
      });
    },
    [emphasizeEnergy, showHeatmap]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    popupRef.current?.remove();
    mapRef.current?.remove();
    mapRef.current = null;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[resolved],
      center: [-98.5795, 39.8283],
      zoom: 3.2,
      attributionControl: {},
      cooperativeGestures: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.on("load", () => {
      addStationLayers(map, resolved);

      map.on("click", "stations-points", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;
        const props = feature.properties;
        const id = props.station_id as string | undefined;
        if (!id) return;
        onSelectStation(id);

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 14,
        })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div role="status">
              <strong style="font-weight:600">${props.name}</strong><br/>
              <span style="font-family:monospace;font-size:12px;opacity:0.7">${props.available}/${props.total} available · ${props.power} kW</span>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseenter", "stations-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [resolved, addStationLayers, onSelectStation]);

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
      tabIndex={0}
    />
  );
}