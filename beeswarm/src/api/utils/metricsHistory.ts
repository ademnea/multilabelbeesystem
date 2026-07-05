/**
 * Helpers for building temperature / humidity time-series when the API
 * returns sparse or missing history data.
 */

export type MetricPoint = {
  timeLabel: string;
  recordedAt?: string;
  temperatureC: number;
  humidityPercent: number;
};

/** Deterministic pseudo-random in [0, 1) from a seed. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Build hourly points going back `hours` from now. */
export function buildHourlyMetricHistory(
  baseTemp: number,
  baseHum: number,
  hours = 24 * 30,
  hiveSeed = 0,
): MetricPoint[] {
  const points: MetricPoint[] = [];
  const now = Date.now();

  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000);
    const hour = time.getHours();
    const dayPhase = (hours - i) / Math.max(hours, 1);
    const dailySwing = Math.sin(dayPhase * Math.PI * 2) * 1.4;
    const diurnal = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 0.9;
    const noise = (seeded(hiveSeed + i * 3.17) - 0.5) * 0.6;

    const temperatureC = parseFloat(
      (baseTemp + dailySwing + diurnal + noise).toFixed(1),
    );
    const humidityPercent = parseFloat(
      Math.min(
        100,
        Math.max(
          0,
          baseHum +
            Math.cos(dayPhase * Math.PI * 2) * 5 +
            (seeded(hiveSeed + i * 7.31) - 0.5) * 4,
        ),
      ).toFixed(0),
    );

    const timeLabel =
      hours <= 48
        ? `${String(hour).padStart(2, "0")}:00`
        : i % 24 === 0
          ? `${time.getMonth() + 1}/${time.getDate()}`
          : `${String(hour).padStart(2, "0")}:00`;

    points.push({ timeLabel, temperatureC, humidityPercent });
  }

  return points;
}

export function normalizeMetricPoint(raw: Record<string, unknown>, index: number): MetricPoint {
  const recordedAt = raw.recorded_at ?? raw.recordedAt;
  return {
    timeLabel: String(
      raw.time_label ?? raw.timeLabel ?? raw.time ?? `T${index + 1}`,
    ),
    recordedAt: recordedAt != null ? String(recordedAt) : undefined,
    temperatureC: Number(raw.temperature_c ?? raw.temperatureC ?? raw.temp ?? 0),
    humidityPercent: Number(
      raw.humidity_percent ?? raw.humidityPercent ?? raw.humidity ?? 0,
    ),
  };
}

export function normalizeHiveHistory(raw: Record<string, unknown>, index: number) {
  const hiveId = String(raw.hiveId ?? raw.hive_id ?? raw.id ?? `Hive-${index + 1}`);
  const hiveName = String(raw.hiveName ?? raw.hive_name ?? raw.name ?? hiveId);
  const historyRaw = raw.history ?? raw.metric_series ?? raw.metricSeries ?? [];
  const history: MetricPoint[] = Array.isArray(historyRaw)
    ? historyRaw.map((p, i) => normalizeMetricPoint(p as Record<string, unknown>, i))
    : [];

  return { hiveId, hiveName, history };
}

/** Average fleet metrics per time index across all hives. */
export function averageFleetMetrics(
  allHivesHistory: Array<{ hiveId: string; history: MetricPoint[] }>,
): MetricPoint[] {
  if (allHivesHistory.length === 0) return [];

  const maxLen = Math.max(...allHivesHistory.map((h) => h.history.length));
  const averaged: MetricPoint[] = [];

  for (let i = 0; i < maxLen; i++) {
    const temps: number[] = [];
    const hums: number[] = [];
    let label = "";
    let recordedAt: string | undefined;

    allHivesHistory.forEach((hive) => {
      const point = hive.history[i];
      if (!point) return;
      temps.push(point.temperatureC);
      hums.push(point.humidityPercent);
      if (!label) label = point.timeLabel;
      if (!recordedAt) recordedAt = point.recordedAt;
    });

    if (temps.length === 0) continue;

    averaged.push({
      timeLabel: label || `T${i + 1}`,
      recordedAt,
      temperatureC: parseFloat(
        (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      ),
      humidityPercent: parseFloat(
        (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(0),
      ),
    });
  }

  return averaged;
}