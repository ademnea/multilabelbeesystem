/**
 * Persists hive GPS coordinates locally so the map still works when
 * GET /hives omits latitude/longitude even though POST saved them.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasValidMapCoordinates } from "./normalizers";

const CACHE_KEY = "@bsads/hive_coordinates";

export type CachedHiveCoordinates = Record<
  string,
  { latitude: number; longitude: number }
>;

async function readCache(): Promise<CachedHiveCoordinates> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CachedHiveCoordinates;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCache(cache: CachedHiveCoordinates): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function saveHiveCoordinates(
  hiveId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  if (!hiveId || !hasValidMapCoordinates(latitude, longitude)) return;
  const cache = await readCache();
  cache[hiveId] = { latitude, longitude };
  await writeCache(cache);
}

export async function loadCachedCoordinates(
  hiveId: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const cache = await readCache();
  return cache[hiveId] ?? null;
}

export async function mergeCachedCoordinates<
  T extends { id: string; latitude?: number; longitude?: number },
>(hives: T[]): Promise<T[]> {
  const cache = await readCache();
  if (Object.keys(cache).length === 0) return hives;

  return hives.map((hive) => {
    if (hasValidMapCoordinates(hive.latitude, hive.longitude)) return hive;
    const cached = cache[hive.id];
    if (!cached || !hasValidMapCoordinates(cached.latitude, cached.longitude)) {
      return hive;
    }
    return { ...hive, latitude: cached.latitude, longitude: cached.longitude };
  });
}
