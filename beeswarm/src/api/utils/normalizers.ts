/**
 * Data normalization utilities
 * Transforms raw API responses into typed application models
 */

import {
  HiveStatus,
  AlertSeverity,
  BeekeeperProfile,
  AlertItem
} from "../types";

export function normalizeStatus(raw: string): HiveStatus {
  const s = raw.trim().toLowerCase();
  
  // If empty or "unknown", treat as unknown (new hive, no sensor data yet)
  if (!s || s === "" || s === "unknown" || s === "null" || s === "undefined")
    return "unknown";
  
  if (
    s === "healthy" ||
    s === "normal" ||
    s === "active_colony" ||
    s === "active"

  )
    return "active";
  if (s === "inactive" || s === "inactive_hive") return "inactive_hive";
  if (
    s === "swarm" ||
    s === "swarming" ||
    s === "pre-swarm" ||
    s === "preswarm" ||
    s === "pre_swarm"
    
  )
    return "swarming";
  if (s === "abscondment") return "Abscondment";
  if (s === "external_noise" || s === "noise") return "external_noise";
  if (s === "quacking_queens" || s === "quacking" || s === "queenbee_present" || s === "quacking_queen_bee") return "quacking_queens";
  if (s === "pests" || s === "pest" || s === "pest_infested") return "pests";
  if (s === "queenless" || s === "no_queen" || s === "missing_queen" || s === "queenbee_absent") return "queenless";
  
  // Default fallback for unknown statuses - treat as unknown
  return "unknown";
}

export function normalizeSeverity(raw: string): AlertSeverity {
  const s = raw.trim().toLowerCase();
  if (s === "critical") return "Critical";
  if (s === "warning") return "Warning";
  return "Info";
}

export function normalizeProfile(
  raw: Record<string, unknown>
): BeekeeperProfile {
  return {
    id: String(raw.user_id ?? raw.id ?? ""),
    full_name: String(raw.full_name ?? raw.name ?? "Beekeeper"),
    email: raw.email != null ? String(raw.email) : null,
    phone: String(raw.phone ?? ""),
    address: raw.address != null ? String(raw.address) : null,
    profile_photo_url:
      raw.profile_photo_url != null ? String(raw.profile_photo_url) : null,
    api_key: raw.api_key != null ? String(raw.api_key) : null,
    server_url:
      raw.server_url != null ? normalizeUrl(String(raw.server_url)) : null,
  };
}

export function normalizeAlertItem(
  item: any,
  index: number,
  fallbackHiveId = "",
): AlertItem { 
  return {
    id: String(item.id ?? `ALT-${index + 1}`),
    hiveId: String(item.hive_id ?? item.hiveId ?? fallbackHiveId),
    severity: normalizeSeverity(String(item.severity ?? item.level ?? "info")),
    title: String(item.title ?? item.alert ?? "Alert"),
    date: String(item.date ?? item.createdAt ?? item.created_at ?? ""),
    summary: String(item.summary ?? item.message ?? ""),
    alertStatus: String(item.alertStatus ?? item.action_status ?? "pending"),
    hiveName: String(item.hive_name ?? item.hiveName ?? ""),
    viewedAt: item.viewed_at ?? null,
  };
}

export function normalizeHiveAlertItem(
  item: any,
  index: number,
  fallbackHiveId = "",
): AlertItem {
  return {
    id: String(item.alert_id ?? item.id ?? `ALT-${index + 1}`),
    hiveId: String(item.hive_id ?? item.hiveId ?? fallbackHiveId),
    severity: normalizeSeverity(
      String(item.severity_level ?? item.severity ?? item.level ?? "info"),
    ),
    title: String(
      item.title ?? item.recommended_action ?? item.action_status ?? "Alert",
    ),
    date: String(
      item.alert_timestamp ??
        item.date ??
        item.createdAt ??
        item.created_at ??
        "",
    ),
    summary: String(
      item.recommended_action ?? item.summary ?? item.message ?? "",
    ),
    // Mobile endpoint returns camelCase alertStatus; hive endpoint returns action_status
    alertStatus: String(item.alertStatus ?? item.action_status ?? "pending"),
    hiveName: String(item.hive_name ?? item.hiveName ?? ""),
    viewedAt: item.viewed_at ?? null,
  };
}

export function normalizeUrl(url: string | null | undefined): string | null {
  const s = String(url ?? "")
    .trim()
    .replace(/\/$/, "");
  return s || null;
}

export function toFiniteOrUndefined(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse latitude/longitude from common API field shapes. */
export function parseHiveCoordinates(item: Record<string, unknown>): {
  latitude?: number;
  longitude?: number;
} {
  const locationValue = item.location;
  const nested =
    (typeof locationValue === "object" && locationValue !== null
      ? (locationValue as Record<string, unknown>)
      : undefined) ??
    (typeof item.coordinates === "object" &&
    item.coordinates !== null &&
    !Array.isArray(item.coordinates)
      ? (item.coordinates as Record<string, unknown>)
      : undefined) ??
    (typeof item.geo === "object" && item.geo !== null
      ? (item.geo as Record<string, unknown>)
      : undefined) ??
    (typeof item.gps === "object" && item.gps !== null
      ? (item.gps as Record<string, unknown>)
      : undefined);

  let latitude = toFiniteOrUndefined(
    item.latitude ??
      item.lat ??
      item.gps_latitude ??
      item.hive_latitude ??
      nested?.latitude ??
      nested?.lat,
  );
  let longitude = toFiniteOrUndefined(
    item.longitude ??
      item.lng ??
      item.lon ??
      item.gps_longitude ??
      item.hive_longitude ??
      nested?.longitude ??
      nested?.lng ??
      nested?.lon,
  );

  const point = item.coordinates ?? item.coords ?? item.geo_point;
  if (Array.isArray(point) && point.length >= 2) {
    const a = Number(point[0]);
    const b = Number(point[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      // GeoJSON uses [lng, lat]; some APIs use [lat, lng]
      if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
        latitude = latitude ?? a;
        longitude = longitude ?? b;
      } else {
        longitude = longitude ?? a;
        latitude = latitude ?? b;
      }
    }
  }

  // Some backends embed "lat, lng" in the location label string
  if (latitude == null || longitude == null) {
    for (const candidate of [item.hive_location, item.location, item.address]) {
      if (typeof candidate !== "string") continue;
      const match = candidate.match(
        /(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/,
      );
      if (!match) continue;
      const a = Number(match[1]);
      const b = Number(match[2]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        latitude = latitude ?? a;
        longitude = longitude ?? b;
        break;
      }
      if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
        latitude = latitude ?? b;
        longitude = longitude ?? a;
        break;
      }
    }
  }

  if (latitude != null && longitude != null && Math.abs(latitude) > 90 && Math.abs(longitude) <= 90) {
    [latitude, longitude] = [longitude, latitude];
  }

  if (latitude === 0 && longitude === 0) {
    return {};
  }

  return { latitude, longitude };
}

export function hasValidMapCoordinates(
  latitude?: number,
  longitude?: number,
): latitude is number {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

export function validateServerUrl(
  url: string | null | undefined,
): string | null {
  const s = normalizeUrl(url);
  if (!s) return "Server URL is required.";
  try {
    new URL(s);
    return null;
  } catch {
    return "Enter a valid URL, e.g. https://jockstrap-boxlike-revisable.ngrok-free.dev";
  }
}