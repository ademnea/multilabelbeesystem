/**
 * System monitoring service
 *
 * recordings_today and silent_hives now come from the /dashboard endpoint
 * (baked in server-side) so this file only handles low-confidence inferences.
 */

import { apiRequest } from "../client";

export type RecordingDetail = {
  id: string;
  hiveId: string;
  hiveName?: string;
  durationSeconds: number;
  recordedAt: string;
};

export type SilentHiveDetail = {
  hiveId: string;
  lastSeenHoursAgo: number;
  hiveName?: string;
  lastInferenceAt?: string | null;
};

export type LowConfidenceInference = {
  hiveId: string;
  hiveName?: string;
  inferenceScore: number;
  time: string;
};

export async function fetchLowConfidenceInferences(): Promise<LowConfidenceInference[]> {
  try {
    const [raw, { fetchHives }] = await Promise.all([
      apiRequest<any>("/inferences").catch(() => null),
      import("./hive.service"),
    ]);

    if (!raw) return [];

    const hives = await fetchHives().catch(() => [] as any[]);
    const hiveById = new Map(hives.map((h: any) => [h.id, h]));
    const inferences: any[] = Array.isArray(raw) ? raw : raw?.inferences ?? raw?.data ?? [];

    return inferences
      .filter((inf) => Number(inf.confidence ?? inf.confidence_score) < 0.6)
      .map((inf) => ({
        hiveId: String(inf.hive_id),
        hiveName: hiveById.get(String(inf.hive_id))?.name,
        inferenceScore: Number(inf.confidence ?? inf.confidence_score ?? 0),
        time: String(inf.created_at),
      }));
  } catch {
    return [];
  }
}
