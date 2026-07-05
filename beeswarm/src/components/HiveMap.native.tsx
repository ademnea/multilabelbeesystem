import React, { useMemo } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { HiveStatus } from "../api";

export type MapHive = {
  id: string;
  name: string;
  location: string;
  status: HiveStatus;
  latitude: number;
  longitude: number;
  temperatureC?: number;
  humidityPercent?: number;
};

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

function escapeForHtml(json: string) {
  return json.replace(/</g, "\\u003c");
}

function buildMapHtml(
  hives: MapHive[],
  region: MapRegion,
  statusColor: Record<HiveStatus, string>,
  satellite: boolean,
  temperatureUnit: "C" | "F",
) {
  const payload = escapeForHtml(JSON.stringify({ hives, region, statusColor, temperatureUnit }));

  // Street map: OpenStreetMap  |  Satellite: Esri World Imagery (free, no key)
  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = satellite
    ? "Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics"
    : "&copy; OpenStreetMap contributors";
  const tileConfig = escapeForHtml(JSON.stringify({ tileUrl, attribution }));

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
      html, body, #map { margin: 0; width: 100%; height: 100%; overflow: hidden; }

      /* ── Teardrop pin ─────────────────────────────────────────── */
      .pin-wrapper {
        display: flex; flex-direction: column; align-items: center;
        background: none; border: none; padding: 0; cursor: pointer;
        position: relative;
      }

      /* Circular head of the pin */
      .pin-head {
        width: 36px; height: 36px; border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, box-shadow 0.15s;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 16px;
        position: relative; z-index: 2;
      }
      .pin-wrapper:active .pin-head,
      .pin-wrapper.active .pin-head {
        transform: scale(1.15);
        box-shadow: 0 5px 18px rgba(0,0,0,0.45);
      }

      /* Pointed tail of the teardrop */
      .pin-tail {
        width: 0; height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        margin-top: -2px;
        position: relative; z-index: 1;
        filter: drop-shadow(0 3px 3px rgba(0,0,0,0.2));
      }

      /* ── Popup card (shown on tap) ────────────────────────────── */
      .popup {
        display: none;
        position: absolute;
        bottom: calc(100% + 10px);
        left: 50%; transform: translateX(-50%);
        background: #1e293b;
        border-radius: 10px;
        padding: 10px 14px;
        min-width: 140px; max-width: 200px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        white-space: nowrap;
        z-index: 999;
        font-family: system-ui, -apple-system, sans-serif;
        pointer-events: none;
      }
      /* Arrow below popup pointing to pin */
      .popup::after {
        content: "";
        position: absolute;
        top: 100%; left: 50%; transform: translateX(-50%);
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 8px solid #1e293b;
      }
      .pin-wrapper.active .popup { display: block; }
      .popup-name {
        font-size: 13px; font-weight: 800; color: #f1f5f9;
        overflow: hidden; text-overflow: ellipsis;
        margin-bottom: 4px;
      }
      .popup-status {
        font-size: 10px; font-weight: 700;
        text-transform: capitalize;
        padding: 2px 7px; border-radius: 20px;
        display: inline-block;
      }
      .popup-divider { height: 1px; background: #334155; margin: 6px 0; }
      .popup-row {
        display: flex; align-items: center; gap: 5px; margin-top: 3px;
      }
      .popup-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .popup-val { font-size: 10px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script>
      const payload = ${payload};
      const tiles  = ${tileConfig};
      let hasFitBounds = false;

      const map = new maplibregl.Map({
        container: "map",
        style: {
          version: 8,
          sources: { base: { type: "raster", tiles: [tiles.tileUrl], tileSize: 256, attribution: tiles.attribution } },
          layers: [{ id: "base-tiles", type: "raster", source: "base", minzoom: 0, maxzoom: 19 }],
        },
        center: [payload.region.longitude, payload.region.latitude],
        zoom: 13,
      });

      function postMsg(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      // Close all popups
      function closeAll() {
        document.querySelectorAll(".pin-wrapper.active").forEach(function(el) {
          el.classList.remove("active");
        });
      }

      // Tap on map background closes popups
      map.on("click", closeAll);

      function formatTemp(celsius) {
        if (payload.temperatureUnit === "F") {
          return (celsius * 9 / 5 + 32).toFixed(1) + "°F";
        }
        return celsius.toFixed(1) + "°C";
      }

      function addMarkers() {
        payload.hives.forEach(function(hive) {
        const color = payload.statusColor[hive.status] || "#FFB268";
        const hasSensor = hive.temperatureC != null && hive.humidityPercent != null;
        const tempHigh = hive.temperatureC > 34.5;
        const humHigh  = hive.humidityPercent > 65;

        const wrapper = document.createElement("button");
        wrapper.className = "pin-wrapper";
        wrapper.setAttribute("aria-label", (hive.name || hive.id) + " — " + hive.status);

        // ── Popup card ──────────────────────────────────────────
        const popup = document.createElement("div");
        popup.className = "popup";

        const pName = document.createElement("div");
        pName.className = "popup-name";
        pName.textContent = hive.name || hive.id;
        popup.appendChild(pName);

        const pStatus = document.createElement("span");
        pStatus.className = "popup-status";
        pStatus.style.background = color + "33";
        pStatus.style.color = color;
        pStatus.textContent = hive.status.replace(/_/g, " ");
        popup.appendChild(pStatus);

        if (hasSensor) {
          const div = document.createElement("div");
          div.className = "popup-divider";
          popup.appendChild(div);

          const tempRow = document.createElement("div");
          tempRow.className = "popup-row";
          const tDot = document.createElement("div");
          tDot.className = "popup-dot"; tDot.style.background = "#f97316";
          const tVal = document.createElement("span");
          tVal.className = "popup-val";
          tVal.style.color = tempHigh ? "#fb923c" : "#fdba74";
          tVal.textContent = "🌡 " + formatTemp(hive.temperatureC) + (tempHigh ? " ↑" : "");
          tempRow.appendChild(tDot); tempRow.appendChild(tVal);
          popup.appendChild(tempRow);

          const humRow = document.createElement("div");
          humRow.className = "popup-row";
          const hDot = document.createElement("div");
          hDot.className = "popup-dot"; hDot.style.background = "#60a5fa";
          const hVal = document.createElement("span");
          hVal.className = "popup-val";
          hVal.style.color = humHigh ? "#93c5fd" : "#bfdbfe";
          hVal.textContent = "💧 " + hive.humidityPercent.toFixed(0) + "%" + (humHigh ? " ↑" : "");
          humRow.appendChild(hDot); humRow.appendChild(hVal);
          popup.appendChild(humRow);
        }

        wrapper.appendChild(popup);

        // ── Teardrop pin head ───────────────────────────────────
        const head = document.createElement("div");
        head.className = "pin-head";
        head.style.background = color;
        head.textContent = "🐝";
        wrapper.appendChild(head);

        // ── Teardrop tail ───────────────────────────────────────
        const tail = document.createElement("div");
        tail.className = "pin-tail";
        tail.style.borderTop = "12px solid " + color;
        wrapper.appendChild(tail);

        // Tap: toggle popup, send message to RN
        wrapper.addEventListener("click", function(e) {
          e.stopPropagation();
          const wasActive = wrapper.classList.contains("active");
          closeAll();
          if (!wasActive) wrapper.classList.add("active");
          postMsg({ type: "markerPress", hiveId: hive.id });
        });

        // anchor: "bottom" places the bottom of the element at the coordinate.
        // The popup floats ABOVE the pin, so we wrap pin+tail in a nested element
        // and use that as the anchor target — keeping the tail tip on the coordinate.
        new maplibregl.Marker({ element: wrapper, anchor: "bottom" })
          .setLngLat([hive.longitude, hive.latitude])
          .addTo(map);
      });

        if (!hasFitBounds) {
          hasFitBounds = true;
          if (payload.hives.length > 1) {
            const bounds = new maplibregl.LngLatBounds();
            payload.hives.forEach(function(h) { bounds.extend([h.longitude, h.latitude]); });
            map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
          } else if (payload.hives.length === 1) {
            const h = payload.hives[0];
            map.flyTo({ center: [h.longitude, h.latitude], zoom: 14 });
          }
        }
      }

      if (map.loaded()) {
        addMarkers();
      } else {
        map.on("load", addMarkers);
      }
    </script>
  </body>
</html>`;
}

export default function HiveMap({
  mapHives,
  region,
  statusColor,
  onMarkerPress,
  satellite = false,
  temperatureUnit = "C",
}: Props) {
  const mapKey = mapHives
    .map((h) => `${h.id}:${h.latitude}:${h.longitude}`)
    .join("|");
  const html = useMemo(
    () => buildMapHtml(mapHives, region, statusColor, satellite, temperatureUnit),
    [mapHives, statusColor, satellite, temperatureUnit],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        hiveId?: string;
      };
      if (message.type === "markerPress" && message.hiveId) {
        onMarkerPress(message.hiveId);
      }
    } catch {
      // Ignore malformed messages
    }
  };

  return (
    <WebView
      key={mapKey}
      originWhitelist={["*"]}
      source={{ html }}
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      onMessage={handleMessage}
    />
  );
}
