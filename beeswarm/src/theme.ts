import { Platform } from "react-native";
import { HiveStatus, AlertSeverity } from "./api";

export type Theme = typeof LIGHT_THEME;

const LIGHT_THEME = {
  isDark: false,
  primary: "#001E37",
  accent: "#FFB268",
  page: "#F8F9FB",
  surface: "#FFFFFF",
  surfaceSoft: "#FFF5EA",
  line: "#DCE2EA",
  text: "#1F2A37",
  textMuted: "#667085",
  placeholder: "#98A2B3",
  fontFamily: {
    regular: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_400Regular",
    medium: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_500Medium",
    semiBold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_600SemiBold",
    bold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_700Bold",
    extraBold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_800ExtraBold",
  },
};

const DARK_THEME = {
  isDark: true,
  primary: "#FFB268",
  accent: "#1264c9ff",
  page: "#0B1220",
  surface: "#111827",
  surfaceSoft: "#1F2937",
  line: "#334155",
  text: "#E5E7EB",
  textMuted: "#94A3B8",
  placeholder: "#64748B",
  fontFamily: {
    regular: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_400Regular",
    medium: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_500Medium",
    semiBold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_600SemiBold",
    bold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_700Bold",
    extraBold: Platform.OS === "web" ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" : "Inter_800ExtraBold",
  },
};

export const THEME = { ...LIGHT_THEME };

export function applyThemeMode(isDarkMode: boolean): void {
  const nextTheme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  Object.assign(THEME, nextTheme);
}

export const STATUS_COLOR: Record<HiveStatus, string> = {
  active: "#16A34A",
  inactive_hive: "#D97706",
  swarming: "#DC2626",
  Abscondment: "#6B7280",
  external_noise: "#DC2446",
  quacking_queens: "#8B5CF6",
  pests: "#EF4444",
  queenless: "#EC4899",
  unknown: "#94A3B8"
};

export function displayStatus(status: HiveStatus): string {
  if (status === "active") return "Harmonious";
  if (status === "inactive_hive") return "Empty";
  if (status === "swarming") return "Swarming";
  if (status === "Abscondment") return "Deserted";
  if (status === "external_noise") return "External Noise";
  if (status === "quacking_queens") return "2 Queens!";
  if (status === "pests") return "Pest Infestation";
  if (status === "queenless") return "Queenless";
  if (status === "unknown") return "Unknown";
  return "Unknown";
}

export function statusCondition(status: HiveStatus): string {
  if (status === "active") return "Colony stable";
  if (status === "inactive_hive") return "Missing queen · Colony may have departed";
  if (status === "swarming") return "Colony splitting · Immediate action needed";
  if (status === "Abscondment") return "Colony has permanently abandoned the hive";
  if (status === "external_noise") return "High environmental audio levels detected";
  if (status === "quacking_queens") return "Queen cells detected · Supercedure risk";
  if (status === "pests") return "Intruders detected inside the hive box";
  if (status === "queenless") return "No active laying queen found in brood nest";
  if (status === "unknown") return "New hive · Waiting for first analysis";
  return "New hive · Waiting for first analysis";
}


export function formatStateDuration(since?: string): string {
  if (!since) return "";
  const ms = Date.now() - Date.parse(since);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function formatRelativeTime(timestamp?: string | null): string {
  if (!timestamp) return "No analysis yet";
  
  // Backend stores UTC timestamps without a 'Z' suffix.
  // Append 'Z' so JavaScript parses them as UTC, not local time.
  const normalized = timestamp.endsWith("Z") || timestamp.includes("+")
    ? timestamp
    : timestamp + "Z";

  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "Invalid date";
  
  const ms = Date.now() - date.getTime();
  if (!Number.isFinite(ms)) return "Invalid date";
  
  if (ms < 0) return "just now";
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function formatAbsoluteTime(timestamp?: string | null): string {
  if (!timestamp) return "No time available";
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";
  
  // Format: "Jun 10, 2026 at 11:50 PM"
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  
  return date.toLocaleString("en-US", options);
}

export function severityColor(severity: AlertSeverity): string {
  if (severity === "Critical") return "#DC2626";
  if (severity === "Warning") return "#D97706";
  return "#2563EB";
}