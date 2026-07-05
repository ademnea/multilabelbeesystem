/**
 * HTTP client configuration and core request handler
 */

import { Platform } from "react-native";
import { loadApiBaseUrl, saveApiBaseUrl } from "./utils/storage";
import { addToQueue, processQueue } from "./utils/offlineQueue";
import * as Network from "expo-network";

// Set to false to disable request/response logging
const API_DEBUG = true;

function log(tag: string, ...args: unknown[]) {
  if (API_DEBUG) {
    console.log(`[BSADS API] ${tag}`, ...args);
  }
}

// ── API base URL ─────────────────────────────────────────────────────────────
// Railway (production) — commented out while running locally:
// export const BASE_URL = "https://bsads-api-production.up.railway.app";

//server
export const BASE_URL = "http://196.43.168.57:8085";
 
// export const BASE_URL =
//   (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_BASE_URL)
//     ? process.env.EXPO_PUBLIC_API_BASE_URL
//     : "http://localhost:8000";

// Web dev proxy prefix — routes /api-proxy/* through metro.config.js to avoid CORS.
// Used automatically when running `expo start --web` in dev mode.
const WEB_DEV_PROXY_PREFIX = "/api-proxy";
const REQUEST_TIMEOUT_MS = 60_000;

// In-memory state
let _authToken: string | null = null;
let _serverUrl: string = BASE_URL;
let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getServerUrl(): string {
  return _serverUrl;
}

export function setServerUrl(url: string | null): void {
  const normalized = url?.trim().replace(/\/$/, "") || null;
  if (normalized && !isBsadsApiBaseUrl(normalized)) {
    log("Ignoring invalid API base URL:", normalized);
    _serverUrl = BASE_URL;
    return;
  }
  _serverUrl = normalized ?? BASE_URL;
  void saveApiBaseUrl(_serverUrl).catch(() => {});
}

function isBsadsApiBaseUrl(url: string): boolean {
  const u = url.toLowerCase();
  try {
    new URL(url);
  } catch {
    return false;
  }
  // Farmer recording servers and dev frontends return HTML, not JSON API responses.
  if (u.includes("ngrok")) return false;
  // if (u.includes(":8081")) return false; // Expo Metro bundler, not an API server

  // Allow your production server and local servers
  if (u.includes("196.43.168.57")) return true;
  if (u.includes("railway.app")) return true;
  if (u.includes("localhost") || u.includes("127.0.0.1") || u.includes("10.0.2.2"))
    return true;
  if (u.includes(":8000")) return true;
  if (u.includes(":8085")) return true;
  return false;
}

export async function initializeApiClient(): Promise<void> {
  _serverUrl = await loadApiBaseUrl(BASE_URL);
}

export async function initServerUrlFromStorage(): Promise<void> {
  await initializeApiClient();
}

function buildRequestUrl(
  path: string,
  query?: Record<string, string>,
  explicitBase?: string,
): string {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  if (explicitBase) return `${explicitBase}${path}${qs}`;
  
  // Expo web in dev: same-origin proxy
  if (Platform.OS === "web" && typeof __DEV__ !== "undefined" && __DEV__) {
    return `${WEB_DEV_PROXY_PREFIX}${path}${qs}`;
  }
  
  const base = _serverUrl || BASE_URL;
  return `${base}${path}${qs}`;
}

function looksLikeHtmlBody(text: string): boolean {
  const t = text.trimStart().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

function htmlApiError(base: string): Error {
  return new Error(
    `The server at ${base} returned a web page instead of API data. ` +
      `The app may be pointing at the wrong URL. Expected the BSADS API ` +
      `(e.g. ${BASE_URL}). Log out, clear app storage, or reinstall if this persists.`,
  );
}

function formatNetworkFailure(base: string, err: unknown): Error {
  const isLocal =
    base.includes("localhost") ||
    base.includes("127.0.0.1") ||
    base.includes("10.0.2.2");

  if (isLocal) {
    return new Error(
      `Cannot reach ${base} from this device. A local dev server only works on the same machine or emulator — the app uses ${BASE_URL}.`,
    );
  }

  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  const name = err instanceof Error ? err.name : "";

  if (
    name === "AbortError" ||
    lower.includes("aborted") ||
    lower.includes("timeout")
  ) {
    return new Error(
      `The BSADS API timed out. Wait 30 seconds and try again (Railway may be waking up).`,
    );
  }

  // Check for actual SSL/TLS issues on HTTPS connections only
  const isHttps = base.startsWith("https://");
  if (
    isHttps &&
    (lower.includes("certificate") ||
      lower.includes("ssl") ||
      lower.includes("tls") ||
      lower.includes("cert"))
  ) {
    return new Error(
      "Secure connection failed. Set your phone date & time to automatic, then try again.",
    );
  }

  // Network connectivity issues (connection refused, not found, etc.)
  if (
    lower.includes("network request failed") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused") ||
    lower.includes("not found") ||
    lower.includes("unreachable")
  ) {
    return new Error(
      `Cannot connect to ${base}. Check that:\n` +
        `1. The server is running\n` +
        `2. Your phone is on the same network (if using local IP)\n` +
        `3. The IP address and port are correct\n\n` +
        `Test by opening ${base}/health in your phone's browser.`,
    );
  }

  return new Error(
    `Request to ${base} failed: ${msg}\n\n` +
      `Try opening ${base}/health in your phone browser. If that works, ` +
      `close Expo Go completely, reopen it, scan the QR code again, then retry.`,
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type ApiInit = {
  method?: string;
  body?: string;
  query?: Record<string, string>;
  baseUrl?: string;
  headers?: Record<string, string>;
  tempHiveId?: string;
};

export async function apiRequest<T>(path: string, init?: ApiInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const url = buildRequestUrl(path, init?.query, init?.baseUrl);
  const base = init?.baseUrl ?? _serverUrl ?? BASE_URL;

  // Check if request is a write operation
  const isWriteOperation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Check network status first
  const networkStatus = await Network.getNetworkStateAsync();
  const isOffline = !networkStatus.isConnected;

  // If offline and it's a write operation, add to queue
  if (isOffline && isWriteOperation) {
    log(`✓ Offline mode — queuing ${method} ${path}`);
    await addToQueue(path, init, init?.tempHiveId);
    // Return undefined for write operations when offline (since we can't get a real response)
    return undefined as T;
  }

  try {
    log(`→ ${method} ${url}`, _authToken ? "(authenticated)" : "(no token)");

    const response = await fetchWithTimeout(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      body: init?.body,
    });

    const status = response.status;
    log(`← ${status} ${url}`);

    if (status === 204) return undefined as T;

    const text = await response.text();
    if (!text.trim()) return undefined as T;

    if (status < 200 || status >= 300) {
      if (looksLikeHtmlBody(text)) {
        log(`✗ HTML ERROR ${status} ${path} from ${base}`);
        throw htmlApiError(base);
      }

      if (status === 401) {
        log("✗ 401 Unauthorized — clearing session");
        _authToken = null;
        _onUnauthorized?.();
      }

      let message = `Request failed (${status})`;
      try {
        const err = JSON.parse(text);
        if (typeof err?.detail === "string") message = err.detail;
        else if (Array.isArray(err?.detail))
          message = err.detail
            .map((d: { msg?: string }) => d?.msg ?? d)
            .join(", ");
      } catch {}
      log(`✗ ERROR ${status} ${path}:`, message);
      throw new Error(message);
    }

    try {
      const parsed = JSON.parse(text) as T;
      log(
        `✓ OK ${path}`,
        typeof parsed === "object"
          ? JSON.stringify(parsed).slice(0, 200)
          : parsed,
      );
      return parsed;
    } catch {
      if (looksLikeHtmlBody(text)) {
        log(`✗ HTML response (expected JSON) ${path} from ${base}`);
        throw htmlApiError(base);
      }
      throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 100)}`);
    }
  } catch (err) {
    // Check if this is a network error and if it's a write operation
    const isNetworkError =
      err instanceof Error &&
      (err.message.includes("network request failed") ||
        err.message.includes("connection refused") ||
        err.message.includes("econnrefused") ||
        err.message.includes("not found") ||
        err.message.includes("unreachable") ||
        err.message.includes("timed out"));

    if (isNetworkError && isWriteOperation) {
      log(`✓ Network error — queuing ${method} ${path}`);
      await addToQueue(path, init, init?.tempHiveId);
      return undefined as T;
    }

    if (
      err instanceof Error &&
      !err.message.startsWith("Request failed") &&
      !err.message.startsWith("Invalid JSON") &&
      !err.message.startsWith("The server at")
    ) {
      const netErr = formatNetworkFailure(base, err);
      log(`✗ NETWORK ERROR ${url}:`, netErr.message);
      throw netErr;
    }
    throw err;
  }
}

export async function apiRequestWithRetry<T>(
  path: string,
  init?: ApiInit,
): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("timed out")) {
      log("↻ Retrying after 3s…");
      await new Promise((r) => setTimeout(r, 3000));
      return apiRequest<T>(path, init);
    }
    throw err;
  }
}

export async function pingApi(baseUrl = BASE_URL): Promise<boolean> {
  try {
    const url =
      Platform.OS === "web" && typeof __DEV__ !== "undefined" && __DEV__
        ? `${WEB_DEV_PROXY_PREFIX}/health`
        : `${baseUrl}/health`;
    const res = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
      15_000,
    );
    return res.ok;
  } catch (e) {
    log("ping failed:", e);
    return false;
  }
}
