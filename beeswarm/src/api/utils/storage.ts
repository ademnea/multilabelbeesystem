/**
 * AsyncStorage helpers for persisting auth state and configuration
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BeekeeperProfile } from "../types";
import { normalizeUrl } from "./normalizers";

const AUTH_TOKEN_KEY = "@bsads/auth_token";
const AUTH_USER_KEY = "@bsads/auth_user";
const API_BASE_URL_KEY = "@bsads/api_base_url";
const LEGACY_SERVER_URL_KEY = "@bsads/server_url";

export async function saveAuthSession(
  token: string,
  profile: BeekeeperProfile,
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile)),
  ]);
}

export async function loadAuthSession(): Promise<{
  token: string | null;
  profile: BeekeeperProfile | null;
}> {
  try {
    const [token, raw] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(AUTH_USER_KEY),
    ]);
    if (!token || !raw) return { token: null, profile: null };
    return { token, profile: JSON.parse(raw) as BeekeeperProfile };
  } catch {
    return { token: null, profile: null };
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_USER_KEY),
  ]);
}

export async function saveProfile(profile: BeekeeperProfile): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
}

export async function saveApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_URL_KEY, url);
}

export async function loadApiBaseUrl(
  defaultUrl: string,
): Promise<string> {
  try {
    const [stored, legacy] = await Promise.all([
      AsyncStorage.getItem(API_BASE_URL_KEY),
      AsyncStorage.getItem(LEGACY_SERVER_URL_KEY),
    ]);

    const candidate = stored ?? legacy;
    const normalized = normalizeUrl(candidate) ?? defaultUrl;

    // Drop unreachable local dev URLs saved during emulator testing — removed,
    // local servers are now supported.
    // if (isLocalDev) { ... }

    if (!stored && candidate) {
      await AsyncStorage.setItem(API_BASE_URL_KEY, normalized);
    }

    // Remove legacy key when it held invalid value
    if (legacy && legacy !== normalized) {
      await AsyncStorage.removeItem(LEGACY_SERVER_URL_KEY);
    }

    return normalized;
  } catch {
    return defaultUrl;
  }
}
