"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map, type Popup } from "maplibre-gl";
import type { StationRecord } from "@/lib/schema/station";
import { markerColor, congestionHeatColor } from "@/lib/utils/colors";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ??
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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
        status: s.occupancy_status,
        energy: s.energy_portfolio_type,
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-98.5795, 39.8283],
      zoom: 3.2,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
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
        layout: { visibility: "none" },
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
          "circle-stroke-color": "#0f172a",
          "circle-stroke-width": 1.2,
          "circle-opacity": 0.95,
        },
      });

      map.on("click", "stations-points", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) return;
        const props = feature.properties;
        const id = props.station_id as string | undefined;
        if (!id) return;
        onSelectStation(id);

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${props.name}</strong><br/>
             <span style="color:#94a3b8">${props.available}/${props.total} free · ${props.power} kW</span>`
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
  }, [emphasizeEnergy, onSelectStation]);

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
    map.flyTo({
      center: [station.longitude, station.latitude],
      zoom: Math.max(map.getZoom(), 9),
      speed: 1.2,
    });
  }, [selectedStationId, stations]);

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full" />
  );
}