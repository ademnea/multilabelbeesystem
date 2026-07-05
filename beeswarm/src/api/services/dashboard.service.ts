/**
 * Dashboard service
 * Handles dashboard statistics and metrics
 */

import { apiRequest } from "../client";
import { DashboardData, HiveStatus } from "../types";
import { fetchHiveDetail, fetchHives } from "./hive.service";
import { fetchLowConfidenceInferences } from "./system.service";
import {
  buildHourlyMetricHistory,
  normalizeHiveHistory,
  normalizeMetricPoint,
  MetricPoint,
} from "../utils/metricsHistory";
import { cacheData, getCachedData } from "../utils/offlineCache";

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

type HiveSnapshot = {
  hiveId: string;
  hiveName: string;
  temperatureC: number;
  humidityPercent: number;
  status?: HiveStatus;
};

type HiveHistoryEntry = {
  hiveId: string;
  hiveName: string;
  history: MetricPoint[];
};

/** Load metric_series from each hive in parallel (dashboard API does not include this). */
export async function fetchFleetMetricsFromHives(): Promise<{
  allHives: HiveSnapshot[];
  allHivesHistory: HiveHistoryEntry[];
}> {
  const hives = await fetchHives();
  if (hives.length === 0) {
    return { allHives: [], allHivesHistory: [] };
  }

  // Fetch all hive details in parallel
  const details = await Promise.all(
    hives.map((hive) => fetchHiveDetail(hive.id).catch(() => null)),
  );

  const allHivesHistory: HiveHistoryEntry[] = [];
  const allHives: HiveSnapshot[] = [];

  details.forEach((detail, i) => {
    if (!detail) return;
    const hiveId = detail.id;
    const hive = hives[i];
    const history =
      detail.metricSeries.length > 0
        ? detail.metricSeries
        : []; // Don't generate fake history for new hives

    allHivesHistory.push({ hiveId, hiveName: detail.name, history });

    const last = history[history.length - 1];
    allHives.push({
      hiveId,
      hiveName: detail.name,
      temperatureC: last?.temperatureC ?? 0,
      humidityPercent: last?.humidityPercent ?? 0,
      status: hive?.status,
    });
  });

  return { allHives, allHivesHistory };
}

/**
 * Build a per-time-label status-count trend from hive histories and their
 * current statuses.  Because the API records the *current* state of each
 * hive (not a full state-change log), we use the current status for every
 * time point — giving a real picture of how many hives sit in each state
 * across the time window.
 *
 * Returns points sorted chronologically, one entry per unique time label.
 */
/** Bucket key for aligning readings across hives. Truncates to the hour so
 *  readings from different days at the same hour don't collide — using the
 *  bare "HH:MM" time label would merge e.g. Monday 14:00 and Tuesday 14:00. */
function bucketKey(p: MetricPoint): string {
  if (p.recordedAt) {
    const d = new Date(p.recordedAt);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }
  return p.timeLabel;
}

function buildStatusTrend(
  allHivesHistory: HiveHistoryEntry[],
  allHives: HiveSnapshot[],
): DashboardData["statusTrend"] {
  // Collect ordered unique time buckets, remembering one display label + timestamp each.
  const keys: string[] = [];
  const meta = new Map<string, { timeLabel: string; recordedAt?: string }>();
  allHivesHistory.forEach((h) => {
    h.history.forEach((p) => {
      const key = bucketKey(p);
      if (!meta.has(key)) {
        meta.set(key, { timeLabel: p.timeLabel, recordedAt: p.recordedAt });
        keys.push(key);
      }
    });
  });

  // Build a status→count map per time bucket.
  // For each bucket that a hive has a reading for, add its current status.
  return keys.map((key) => {
    const counts: Partial<Record<HiveStatus, number>> = {};
    allHivesHistory.forEach((h, idx) => {
      const hasReading = h.history.some((p) => bucketKey(p) === key);
      if (!hasReading) return;
      const status = allHives[idx]?.status;
      if (status) {
        counts[status] = (counts[status] ?? 0) + 1;
      }
    });
    const { timeLabel, recordedAt } = meta.get(key)!;
    return { timeLabel, recordedAt, counts };
  });
}

/**
 * Build trend points per day from hive metric histories.
 * "Count" = number of hives whose last reading for that day exceeds the
 * pre-swarm temperature threshold (34.5 °C).
 */
function buildTrendFromHistory(
  allHivesHistory: HiveHistoryEntry[],
  allHives: HiveSnapshot[],
): DashboardData["preSwarmTrend"] {
  const TEMP_THRESHOLD = 34.5;

  // Collect all unique day labels across all hive histories
  const daySet = new Set<string>();
  allHivesHistory.forEach((h) => {
    h.history.forEach((p) => {
      // Use first 5 chars of timeLabel as day key (e.g. "Apr 1" from "Apr 1 14:00")
      const day = p.timeLabel.split(" ").slice(0, 2).join(" ");
      if (day) daySet.add(day);
    });
  });

  const days = Array.from(daySet).slice(-30); // keep last 30 days

  return days.map((day) => {
    const statusBreakdown: Partial<Record<HiveStatus, number>> = {};
    let totalCount = 0;

    allHivesHistory.forEach((h, idx) => {
      // Find readings that belong to this day
      const dayReadings = h.history.filter((p) =>
        p.timeLabel.startsWith(day),
      );
      if (dayReadings.length === 0) return;

      const avgTemp =
        dayReadings.reduce((sum, p) => sum + p.temperatureC, 0) /
        dayReadings.length;

      if (avgTemp > TEMP_THRESHOLD) {
        totalCount++;
        const hiveSnap = allHives[idx];
        if (hiveSnap?.status) {
          statusBreakdown[hiveSnap.status] =
            (statusBreakdown[hiveSnap.status] ?? 0) + 1;
        }
      }
    });

    return { day, count: totalCount, statusBreakdown };
  });
}

export async function fetchDashboard(): Promise<DashboardData> {
  try {
    // Fire all necessary endpoints in parallel
    const [raw, hivesForStatus, lowConfidenceInferences] = await Promise.all([
      apiRequest<any>("/dashboard"),
      fetchHives().catch(() => [] as Awaited<ReturnType<typeof fetchHives>>),
      fetchLowConfidenceInferences().catch(() => []),
    ]);

    const metrics = raw?.key_metrics ?? raw?.keyMetrics ?? {};

    // Build statusCounts from the backend's status_counts object (snake_case)
    // The backend now returns all 9 states directly.
    const rawCounts = raw?.status_counts ?? raw?.statusCounts ?? {};
    console.log("[dashboard] raw status_counts from API:", JSON.stringify(rawCounts));

    // Start with backend counts (post-restart server has all states)
    const statusCounts: DashboardData["statusCounts"] = {
      active: Number(rawCounts.normal ?? 0),
      inactive_hive: Number(rawCounts.other ?? 0),
      swarming: Number(rawCounts.swarm ?? 0),
      Abscondment: Number(rawCounts.abscondment ?? 0),
      external_noise: Number(rawCounts.external_noise ?? 0),
      quacking_queens: Number(rawCounts.queenbee_present ?? 0),
      pests: Number(rawCounts.pest_infested ?? 0),
      queenless: Number(rawCounts.missing_queen ?? 0),
      unknown: Number(rawCounts.uncertain ?? 0),
    };

    // Fallback: if ALL counts are 0 (old server or cache), count from live hive list
    const backendTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    if (backendTotal === 0 && hivesForStatus.length > 0) {
      console.log("[dashboard] backend counts all zero — falling back to hive list status");
      hivesForStatus.forEach(hive => {
        const s = hive.status;
        if (s in statusCounts) {
          (statusCounts as any)[s]++;
        }
      });
    }

    // Helper to get hive name by id
    const getHiveName = (hiveId: string): string | undefined => {
      const hive = hivesForStatus.find(h => h.id === hiveId);
      return hive?.name;
    };

    const result: DashboardData = {
      totalHives: Number(raw?.total_hives ?? raw?.totalHives ?? hivesForStatus.length),
      activeHives: Number(raw?.active_hives ?? raw?.activeHives ?? statusCounts.active),
      statusCounts,
      keyMetrics: {
        temperatureC: Number(metrics.temperature_c ?? metrics.temperatureC ?? 0),
        humidityPercent: Number(
          metrics.humidity_percent ?? metrics.humidityPercent ?? 0,
        ),
        populationKBees: Number(
          metrics.population_k_bees ?? metrics.populationKBees ?? 0,
        ),
        nectarFlowKgPerDay: Number(
          metrics.nectar_flow_kg_per_day ?? metrics.nectarFlowKgPerDay ?? 0,
        ),
      },
      pendingAlerts: Number(raw?.pending_alerts ?? raw?.pendingAlerts ?? 0),
      acknowledgedAlerts: Number(
        raw?.acknowledged_alerts ?? raw?.acknowledgedAlerts ?? 0,
      ),
      // Normalise API trend data — attach empty statusBreakdown for now
      preSwarmTrend: Array.isArray(raw?.pre_swarm_trend ?? raw?.preSwarmTrend)
        ? (raw?.pre_swarm_trend ?? raw?.preSwarmTrend).map((d: any) => ({
            day: String(d.day ?? d.date ?? d.label ?? ""),
            count: Number(d.count ?? d.value ?? 0),
            statusBreakdown: d.status_breakdown ?? d.statusBreakdown ?? undefined,
          }))
        : [],
      recordingsToday: Number(raw?.recordings_today ?? 0),
      // The backend only returns a count, not a per-hive breakdown, so this is
      // approximated from hives whose last inference happened today — close
      // enough to let the "Recordings Today" card link to the relevant hives.
      recordingsTodayDetails: hivesForStatus
        .filter((h) => h.lastInferenceAt && isToday(h.lastInferenceAt))
        .map((h) => ({
          id: h.id,
          hiveId: h.id,
          hiveName: h.name,
          durationSeconds: 0,
          recordedAt: h.lastInferenceAt!,
        })),
      silentHives: (raw?.silent_hives ?? []).map((h: any) => ({
        hiveId: String(h.hive_id),
        hiveName: String(h.hive_name ?? h.hive_id),
        lastSeenHoursAgo: Number(h.hours_silent ?? 4),
        lastInferenceAt: h.last_audio_at ?? null,
      })),
      highTempPreSwarmHives: Array.isArray(
        raw?.high_temp_pre_swarm_hives ?? raw?.highTempPreSwarmHives,
      )
        ? (raw?.high_temp_pre_swarm_hives ?? raw?.highTempPreSwarmHives).map((h: any) => ({
            hiveId: String(h.hive_id ?? h.hiveId),
            temperatureC: Number(h.temperature_c ?? h.temperatureC ?? 0),
            hiveName: getHiveName(String(h.hive_id ?? h.hiveId)),
          }))
        : [],
      allHives: [],
      allHivesHistory: [],
      statusTrend: [],
      pendingAdvisoryActions: Number(
        raw?.pending_advisory_actions ?? raw?.pendingAdvisoryActions ?? 0,
      ),
      lowConfidenceInferences: lowConfidenceInferences.length,
      lowConfidenceInferencesDetails: lowConfidenceInferences,
    };

    // Fetch per-hive metric history (in parallel with the /dashboard call above,
    // the hive list is already fetched; now we fetch each hive's detail).
    try {
      const details = await Promise.all(
        hivesForStatus.map((hive) =>
          fetchHiveDetail(hive.id).catch(() => null),
        ),
      );

      const allHivesHistory: HiveHistoryEntry[] = [];
      const allHives: HiveSnapshot[] = [];

      details.forEach((detail, i) => {
        if (!detail) return;
        const hiveId = detail.id;
        const hive = hivesForStatus[i];
        const history =
        detail.metricSeries.length > 0
          ? detail.metricSeries
          : []; // Don't generate fake history for new hives

        allHivesHistory.push({ hiveId, hiveName: detail.name, history });

      const last = history[history.length - 1];
      allHives.push({
        hiveId,
        hiveName: detail.name,
        temperatureC: last?.temperatureC ?? 0,
        humidityPercent: last?.humidityPercent ?? 0,
        status: hive?.status,
      });
      });

      if (allHivesHistory.length > 0) {
        result.allHivesHistory = allHivesHistory;
        result.allHives = allHives;

        // Build status trend from real hive history + current statuses
        result.statusTrend = buildStatusTrend(allHivesHistory, allHives);

        // Build preSwarmTrend from real hive history data (replaces / enriches API trend)
        const historyTrend = buildTrendFromHistory(allHivesHistory, allHives);
        if (historyTrend.length > 0) {
          result.preSwarmTrend = historyTrend;
        }
      }
    } catch {
      // Fall back to any inline dashboard payload if present
      const rawHistory = raw?.all_hives_history ?? raw?.allHivesHistory;
      const allHivesRaw = raw?.all_hives ?? raw?.allHives;

      if (Array.isArray(rawHistory) && rawHistory.length > 0) {
        result.allHivesHistory = rawHistory.map(
          (h: Record<string, unknown>, i: number) => {
            const normalized = normalizeHiveHistory(h, i);
            if (normalized.history.length > 0) return normalized;
            const baseTemp = Number(
              h.temperatureC ?? h.temperature_c ?? h.temperature ?? 34,
            );
            const baseHum = Number(
              h.humidityPercent ?? h.humidity_percent ?? h.humidity ?? 60,
            );
            return {
              hiveId: normalized.hiveId,
              hiveName: normalized.hiveName ?? "",
              history: buildHourlyMetricHistory(baseTemp, baseHum, 24 * 30, i + 1),
            };
          },
        );
      } else if (Array.isArray(allHivesRaw) && allHivesRaw.length > 0) {
        result.allHivesHistory = allHivesRaw.map(
          (h: Record<string, unknown>, i: number) => {
            const hiveId = String(
              h.hiveId ?? h.hive_id ?? h.id ?? `Hive-${i + 1}`,
            );
            const baseTemp = Number(
              h.temperatureC ?? h.temperature_c ?? h.temperature ?? 34,
            );
            const baseHum = Number(
              h.humidityPercent ?? h.humidity_percent ?? h.humidity ?? 60,
            );
            const embedded = h.history ?? h.metric_series ?? h.metricSeries;
            const history =
              Array.isArray(embedded) && embedded.length > 0
                ? embedded.map((p: Record<string, unknown>, pi: number) =>
                    normalizeMetricPoint(p, pi),
                  )
                : buildHourlyMetricHistory(baseTemp, baseHum, 24 * 30, i + 1);
            return { hiveId, hiveName: "", history };
          },
        );
        result.allHives = allHivesRaw.map(
          (h: Record<string, unknown>, i: number) => ({
            hiveId: String(h.hiveId ?? h.hive_id ?? h.id ?? `Hive-${i + 1}`),
            hiveName: String(
              h.hiveName ??
                h.hive_name ??
                h.name ??
                h.hiveId ??
                h.hive_id ??
                `Hive ${i + 1}`,
            ),
            temperatureC: Number(
              h.temperatureC ?? h.temperature_c ?? h.temperature ?? 34,
            ),
            humidityPercent: Number(
              h.humidityPercent ?? h.humidity_percent ?? h.humidity ?? 60,
            ),
          }),
        );
      }
    }

    // Cache the dashboard data
    await cacheData("dashboard", result);

    return result;
  } catch (error) {
    // If fetch fails, try to get cached data
    const cached = await getCachedData<DashboardData>("dashboard");
    if (cached) {
      return cached;
    }
    throw error;
  }
}
