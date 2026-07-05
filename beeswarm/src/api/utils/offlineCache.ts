
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY_PREFIX = "@bsads/offline_cache_";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export async function cacheData<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore caching errors
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch {
    return null;
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
  } catch {
    // Ignore clearing errors
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {
    // Ignore clearing errors
  }
}

