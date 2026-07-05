
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { apiRequest } from "../client";
import { Hive } from "../types";
import { getCachedData, cacheData } from "./offlineCache";
import { normalizeStatus, parseHiveCoordinates, hasValidMapCoordinates } from "./normalizers";
import { saveHiveCoordinates } from "./hiveCoordinatesCache";

const QUEUE_KEY = "@bsads/offline_queue";

export type QueuedRequest = {
  id: string;
  path: string;
  init?: {
    method?: string;
    body?: string;
    query?: Record<string, string>;
    baseUrl?: string;
    headers?: Record<string, string>;
  };
  tempHiveId?: string;
  timestamp: number;
};

let queueProcessorRunning = false;

export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedRequest[];
  } catch {
    return [];
  }
}

export async function addToQueue(path: string, init?: QueuedRequest["init"], tempHiveId?: string): Promise<void> {
  try {
    const queue = await getQueuedRequests();
    const newRequest: QueuedRequest = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      path,
      init,
      tempHiveId,
      timestamp: Date.now(),
    };
    queue.push(newRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log("[OfflineQueue] Added request to queue:", newRequest);
  } catch (err) {
    console.error("[OfflineQueue] Failed to add to queue:", err);
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueuedRequests();
    const filteredQueue = queue.filter((req) => req.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    console.log("[OfflineQueue] Removed request from queue:", id);
  } catch (err) {
    console.error("[OfflineQueue] Failed to remove from queue:", err);
  }
}

export async function processQueue(): Promise<void> {
  if (queueProcessorRunning) {
    console.log("[OfflineQueue] Queue processor already running");
    return;
  }

  const status = await Network.getNetworkStateAsync();
  if (!status.isConnected) {
    console.log("[OfflineQueue] Device is offline, skipping queue processing");
    return;
  }

  queueProcessorRunning = true;
  console.log("[OfflineQueue] Starting queue processing");

  try {
    const queue = await getQueuedRequests();
    for (const request of queue) {
      try {
        console.log("[OfflineQueue] Processing queued request:", request);
        const response = await apiRequest(request.path, request.init);

        // If this was a create hive request with a temp ID, update the cache
        if (request.tempHiveId && response) {
          const raw = response as any;
          const coords = parseHiveCoordinates(raw);
          const hiveData = JSON.parse(request.init?.body || "{}");
          const latitude =
            coords.latitude ??
            (hasValidMapCoordinates(hiveData.latitude, hiveData.longitude)
              ? hiveData.latitude
              : undefined);
          const longitude =
            coords.longitude ??
            (hasValidMapCoordinates(hiveData.latitude, hiveData.longitude)
              ? hiveData.longitude
              : undefined);

          const realHive: Hive = {
            id: String(raw.hive_id ?? raw.id ?? raw.hive_name ?? ""),
            name: String(raw.hive_name ?? raw.name ?? raw.hive_id ?? "New Hive"),
            location: String(raw.hive_location ?? raw.location ?? ""),
            type: String(raw.hive_type ?? raw.type ?? ""),
            installationDate: String(raw.installation_date ?? raw.installationDate ?? ""),
            status: normalizeStatus(String(raw.current_state ?? raw.status ?? "unknown")),
            latitude,
            longitude,
            stateSince: raw.state_since ?? raw.stateSince ?? undefined,
          };

          // Update cache: replace temp hive with real one
          const cachedHives = await getCachedData<Hive[]>("hives");
          if (cachedHives) {
            const updatedHives = cachedHives
              .filter((h) => h.id !== request.tempHiveId)
              .concat(realHive)
              .sort((a, b) => a.name.localeCompare(b.name));
            await cacheData("hives", updatedHives);
          }

          if (hasValidMapCoordinates(realHive.latitude, realHive.longitude)) {
            await saveHiveCoordinates(realHive.id, realHive.latitude!, realHive.longitude!);
          }
        }

        await removeFromQueue(request.id);
      } catch (err) {
        console.error("[OfflineQueue] Failed to process queued request:", request, err);
        // If this request fails, we'll stop processing and try again later
        break;
      }
    }
  } finally {
    queueProcessorRunning = false;
    console.log("[OfflineQueue] Queue processing complete");
  }
}

