import React, { useEffect, useRef, useState } from "react";
import { HiveStatus } from "../api";
import type { MapHive } from "./HiveMap.native";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  mapHives: MapHive[];
  region: MapRegion;
  statusColor: Record<HiveStatus, string>;
  onMarkerPress: (hiveId: string) => void;
  satellite?: boolean;
  temperatureUnit?: "C" | "F";
};

function buildMapStyle(satellite: boolean) {
  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = satellite
    ? "Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye"
    : "&copy; OpenStreetMap contributors";
  return {
    version: 8 as const,
    sources: {
      base: { type: "raster" as const, tiles: [tileUrl], tileSize: 256, attribution },
    },
    layers: [{ id: "base-tiles", type: "raster" as const, source: "base", minzoom: 0, maxzoom: 19 }],
  };
}

// Inject CSS once into the document head
function ensureMapStyles() {
  if (typeof document === "undefined") return;
  
  // Inject maplibre-gl CSS first if not already present
  if (!document.getElementById("maplibre-gl-css")) {
    const link = document.createElement("link");
    link.id = "maplibre-gl-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/maplibre-gl@5.22.0/dist/maplibre-gl.css";
    document.head.appendChild(link);
  }
  
  if (document.getElementById("hivemap-web-styles")) return;
  const style = document.createElement("style");
  style.id = "hivemap-web-styles";
  style.textContent = `
    .hive-pin-wrapper {
      display: flex; flex-direction: column; align-items: center;
      background: none; border: none; padding: 0; cursor: pointer;
      position: relative;
    }
    .hive-pin-head {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s, box-shadow 0.15s;
      font-size: 16px;
      position: relative; z-index: 2;
    }
    .hive-pin-wrapper:hover .hive-pin-head {
      transform: scale(1.15);
      box-shadow: 0 5px 18px rgba(0,0,0,0.45);
    }
    .hive-pin-tail {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      margin-top: -2px;
      position: relative; z-index: 1;
      filter: drop-shadow(0 3px 3px rgba(0,0,0,0.2));
    }
    .hive-popup {
      display: none;
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%; transform: translateX(-50%);
      background: #1e293b;
      border-radius: 10px; padding: 10px 14px;
      min-width: 140px; max-width: 200px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      white-space: nowrap;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: none;
    }
    .hive-popup::after {
      content: "";
      position: absolute;
      top: 100%; left: 50%; transform: translateX(-50%);
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 8px solid #1e293b;
    }
    .hive-pin-wrapper:hover .hive-popup { display: block; }
    .hive-popup-name {
      font-size: 13px; font-weight: 800; color: #f1f5f9;
      overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
    }
    .hive-popup-status {
      font-size: 10px; font-weight: 700; text-transform: capitalize;
      padding: 2px 7px; border-radius: 20px; display: inline-block;
    }
    .hive-popup-divider { height: 1px; background: #334155; margin: 6px 0; }
    .hive-popup-row { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
    .hive-popup-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .hive-popup-val { font-size: 10px; font-weight: 700; }
  `;
  document.head.appendChild(style);
}

function formatMapTemp(celsius: number, unit: "C" | "F"): string {
  if (unit === "F") {
    return `${(celsius * 9 / 5 + 32).toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

function buildMarkerElement(
  hive: MapHive,
  color: string,
  onPress: (id: string) => void,
  temperatureUnit: "C" | "F",
): HTMLElement {
  const hasSensor = hive.temperatureC != null && hive.humidityPercent != null;
  const tempHigh = (hive.temperatureC ?? 0) > 34.5;
  const humHigh  = (hive.humidityPercent ?? 0) > 65;

  const wrapper = document.createElement("button");
  wrapper.className = "hive-pin-wrapper";
  wrapper.setAttribute("aria-label", `${hive.name} — ${hive.status}`);

  // Popup card
  const popup = document.createElement("div");
  popup.className = "hive-popup";

  const pName = document.createElement("div");
  pName.className = "hive-popup-name";
  pName.textContent = hive.name || hive.id;
  popup.appendChild(pName);

  const pStatus = document.createElement("span");
  pStatus.className = "hive-popup-status";
  pStatus.style.background = color + "33";
  pStatus.style.color = color;
  pStatus.textContent = hive.status.replace(/_/g, " ");
  popup.appendChild(pStatus);

  if (hasSensor) {
    const div = document.createElement("div");
    div.className = "hive-popup-divider";
    popup.appendChild(div);

    const tempRow = document.createElement("div");
    tempRow.className = "hive-popup-row";
    const tDot = document.createElement("div");
    tDot.className = "hive-popup-dot"; tDot.style.background = "#f97316";
    const tVal = document.createElement("span");
    tVal.className = "hive-popup-val";
    tVal.style.color = tempHigh ? "#fb923c" : "#fdba74";
    tVal.textContent = "🌡 " + formatMapTemp(hive.temperatureC as number, temperatureUnit) + (tempHigh ? " ↑" : "");
    tempRow.appendChild(tDot); tempRow.appendChild(tVal);
    popup.appendChild(tempRow);

    const humRow = document.createElement("div");
    humRow.className = "hive-popup-row";
    const hDot = document.createElement("div");
    hDot.className = "hive-popup-dot"; hDot.style.background = "#60a5fa";
    const hVal = document.createElement("span");
    hVal.className = "hive-popup-val";
    hVal.style.color = humHigh ? "#93c5fd" : "#bfdbfe";
    hVal.textContent = "💧 " + (hive.humidityPercent as number).toFixed(0) + "%" + (humHigh ? " ↑" : "");
    humRow.appendChild(hDot); humRow.appendChild(hVal);
    popup.appendChild(humRow);
  }

  wrapper.appendChild(popup);

  // Teardrop head
  const head = document.createElement("div");
  head.className = "hive-pin-head";
  head.style.background = color;
  head.textContent = "🐝";
  wrapper.appendChild(head);

  // Teardrop tail
  const tail = document.createElement("div");
  tail.className = "hive-pin-tail";
  tail.style.borderTop = `12px solid ${color}`;
  wrapper.appendChild(tail);

  wrapper.addEventListener("click", () => onPress(hive.id));
  return wrapper;
}

export default function HiveMap({
  mapHives,
  region,
  statusColor,
  onMarkerPress,
  satellite = false,
  temperatureUnit = "C",
}: Props) {
  const mapElRef  = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const hasFitBoundsRef = useRef(false);

  // Initialise the map once
  useEffect(() => {
    ensureMapStyles();
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const ml = require("maplibre-gl") as any;
    if (cancelled || !mapElRef.current || mapRef.current) return;

    const map = new ml.Map({
      container: mapElRef.current,
      style: buildMapStyle(satellite),
      center: [region.longitude, region.latitude],
      zoom: 13,
    });
    mapRef.current = map;
    map.on("load", () => { if (!cancelled) setReady(true); });

    return () => {
      cancelled = true;
      hasFitBoundsRef.current = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer when satellite preference changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const style = buildMapStyle(satellite) as any;
    // Replace the source and layer without remounting the map
    if (map.getLayer("base-tiles")) map.removeLayer("base-tiles");
    if (map.getSource("base"))      map.removeSource("base");
    map.addSource("base", style.sources.base);
    map.addLayer(style.layers[0], map.getLayer("base-tiles") ? undefined : undefined);
  }, [satellite, ready]);

  // Refresh markers whenever hives / colors change (NOT region!)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const ml = require("maplibre-gl") as any;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mapHives.forEach((hive) => {
      console.log('Adding hive marker:', hive.id, 'lat:', hive.latitude, 'lng:', hive.longitude);
      const color = statusColor[hive.status] ?? "#FFB268";
      const el = buildMarkerElement(hive, color, onMarkerPress, temperatureUnit);
      const marker = new ml.Marker({ element: el, anchor: "bottom" })
        .setLngLat([hive.longitude, hive.latitude])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (!hasFitBoundsRef.current && mapHives.length > 0) {
      hasFitBoundsRef.current = true;
      if (mapHives.length > 1) {
        const bounds = new ml.LngLatBounds();
        mapHives.forEach((h: MapHive) => bounds.extend([h.longitude, h.latitude]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      } else if (mapHives.length === 1) {
        map.flyTo({ center: [mapHives[0].longitude, mapHives[0].latitude], zoom: 14 });
      }
    }
  }, [ready, mapHives, statusColor, onMarkerPress, temperatureUnit]);

  return (
    <div ref={mapElRef} style={{ width: "100%", height: "100%" }}>
      {!ready && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", color: "#667085", fontSize: 13, fontWeight: 600,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Loading map…
        </div>
      )}
    </div>
  );
}
