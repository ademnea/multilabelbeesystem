import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useTemperatureUnit, convertTemp } from "../hooks/useTemperatureUnit";

type MetricPoint = {
  timeLabel: string;
  recordedAt?: string;
  temperatureC: number;
  humidityPercent: number;
};

type TimeRange = "24h" | "7d" | "30d";

type PerHiveSeries = {
  hiveId: string;
  hiveName: string;
  history: MetricPoint[];
};

type Props = {
  metricSeries: MetricPoint[];
  // hiveId: string;
  hiveName: string;
  showRangeFilter?: boolean;
  /** When set (dashboard), tapping a dot lists each hive's name and value at that time. */
  perHiveSeries?: PerHiveSeries[];
  /** ISO install date of the hive — used to disable range tabs the hive hasn't existed long enough to fill. */
  installationDate?: string;
};

const RANGE_LABELS: Record<TimeRange, string> = { "24h": "24 h", "7d": "7 d", "30d": "30 d" };
const RANGES: TimeRange[] = ["24h", "7d", "30d"];
const RANGE_MIN_DAYS: Record<TimeRange, number> = { "24h": 0, "7d": 1, "30d": 7 };

/** Which ranges are actually meaningful given how long the hive has existed. */
function availableRanges(installationDate?: string): TimeRange[] {
  if (!installationDate) return RANGES;
  const installedAt = new Date(installationDate).getTime();
  if (Number.isNaN(installedAt)) return RANGES;
  const daysSinceInstall = (Date.now() - installedAt) / (1000 * 60 * 60 * 24);
  return RANGES.filter((r) => daysSinceInstall >= RANGE_MIN_DAYS[r]);
}

/** Slice the series to simulate the selected range. */
function sliceForRange(series: MetricPoint[], range: TimeRange): MetricPoint[] {
  if (series.length === 0) return series;
  if (range === "24h") return series.slice(-24);
  if (range === "7d")  return series.slice(-7 * 24);
  return series; // 30d — show all
}

/** 24h shows time-of-day; 7d/30d show the date, since multiple days are on screen. */
function labelFor(point: MetricPoint, range: TimeRange): string {
  if (range === "24h" || !point.recordedAt) return point.timeLabel;
  const date = new Date(point.recordedAt);
  if (Number.isNaN(date.getTime())) return point.timeLabel;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

type SelectedPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
  type: string;
  index: number;
  hiveBreakdown?: Array<{ hiveName: string; value: number }>;
};

export function HiveMetricsLineChart({
  metricSeries,
  // hiveId: _hiveId,
  hiveName: _hiveName,
  showRangeFilter = true,
  perHiveSeries,
  installationDate,
}: Props) {
  const theme = useTheme();
  const { unit: tempUnit, formatTemp } = useTemperatureUnit();
  const displayTemp = (celsius: number) => convertTemp(celsius, tempUnit);
  const [range, setRange] = useState<TimeRange>("24h");
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

  const validRanges = useMemo(() => availableRanges(installationDate), [installationDate]);

  useEffect(() => {
    if (!validRanges.includes(range)) {
      setRange(validRanges[validRanges.length - 1] ?? "24h");
    }
  }, [validRanges, range]);

  const series = useMemo(() => sliceForRange(metricSeries, range), [metricSeries, range]);

  const slicedPerHive = useMemo(
    () =>
      perHiveSeries?.map((hive) => ({
        ...hive,
        history: sliceForRange(hive.history, range),
      })) ?? [],
    [perHiveSeries, range],
  );

  const selectPoint = (
    point: { x: number; y: number; value: number; label: string },
    type: string,
    index: number,
  ) => {
    const isTemp = type === "Temperature";
    const hiveBreakdown = slicedPerHive
      .map((hive) => {
        const reading = hive.history[index];
        if (!reading) return null;
        return {
          hiveName: hive.hiveName || hive.hiveId,
          value: isTemp ? reading.temperatureC : reading.humidityPercent,
        };
      })
      .filter((row): row is { hiveName: string; value: number } => row !== null);

    setSelectedPoint({
      ...point,
      type,
      index,
      hiveBreakdown: hiveBreakdown.length > 0 ? hiveBreakdown : undefined,
    });
  };

  const CHART_HEIGHT   = 220;
  const PAD_TOP        = 20;
  const PAD_BOTTOM     = 32;
  const PAD_LEFT       = 36;
  const PAD_RIGHT      = 40;
  const THRESHOLD_TEMP = 34.5;
  const THRESHOLD_HUM  = 65;
  // Acceptable range for a healthy hive — outside these bounds is cause for concern.
  const TEMP_ACCEPT_MIN = 32;
  const TEMP_ACCEPT_MAX = 36;
  const HUM_ACCEPT_MIN  = 50;
  const HUM_ACCEPT_MAX  = 70;

  if (metricSeries.length === 0) {
    return (
      <Text style={{ textAlign: "center", color: theme.textMuted, paddingVertical: 20 }}>
        No sensor data available yet.
      </Text>
    );
  }

  const tempVals = series.map(p => p.temperatureC);
  const humVals  = series.map(p => p.humidityPercent);

  slicedPerHive.forEach((hive) => {
    hive.history.forEach((p) => {
      tempVals.push(p.temperatureC);
      humVals.push(p.humidityPercent);
    });
  });

  const maxT = Math.max(...tempVals, THRESHOLD_TEMP + 4, 38);
  const minT = Math.min(...tempVals, THRESHOLD_TEMP - 4, 24);
  const maxH = Math.max(...humVals, 100);
  const minH = Math.min(...humVals, 0);

  const n     = series.length;
  const plotW = Math.max(chartWidth - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xOf = (i: number) => PAD_LEFT + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yT  = (v: number) => PAD_TOP + ((maxT - v) / (maxT - minT)) * plotH;
  const yH  = (v: number) => PAD_TOP + ((maxH - v) / (maxH - minH)) * plotH;

  const tPts = series.map((d, i) => ({ x: xOf(i), y: yT(d.temperatureC),    label: labelFor(d, range), value: d.temperatureC }));
  const hPts = series.map((d, i) => ({ x: xOf(i), y: yH(d.humidityPercent), label: labelFor(d, range), value: d.humidityPercent }));

  const threshY    = yT(THRESHOLD_TEMP);
  const humThreshY = yH(THRESHOLD_HUM);

  const tempAcceptMinY = yT(TEMP_ACCEPT_MIN);
  const tempAcceptMaxY = yT(TEMP_ACCEPT_MAX);
  const humAcceptMinY  = yH(HUM_ACCEPT_MIN);
  const humAcceptMaxY  = yH(HUM_ACCEPT_MAX);

  // Decide which x-labels to show so they don't overlap
  const labelStep = Math.max(1, Math.ceil(n / 6));

  return (
    <View style={{ marginTop: 8 }}>

      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        {/* <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: theme.accent, borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Temp</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: "#3B82F6", borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Humidity</Text>
        </View> */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 1.5, backgroundColor: "#22C55E" }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Temp threshold</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 1.5, backgroundColor: "#3B82F6" }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Hum threshold</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 0, borderTopWidth: 1.5, borderColor: theme.accent, borderStyle: "dashed" }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Temp min/max</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 0, borderTopWidth: 1.5, borderColor: "#3B82F6", borderStyle: "dashed" }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Hum min/max</Text>
        </View>
      </View>

      {/* Range filter */}
      {showRangeFilter && (
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
          {RANGES.map(r => (
            <Pressable
              key={r}
              onPress={() => { setRange(r); setSelectedPoint(null); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                backgroundColor: range === r ? theme.accent : theme.surfaceSoft,
                borderWidth: 1,
                borderColor: range === r ? theme.accent : theme.line,
              }}
            >
              <Text style={{
                fontSize: 11, fontWeight: "700",
                color: range === r ? theme.primary : theme.textMuted,
              }}>
                {RANGE_LABELS[r]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Chart canvas */}
      <View
        style={{ height: CHART_HEIGHT, position: "relative" }}
        onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <>
            {/* Left Y-axis labels (temp) */}
            {[0, 0.5, 1].map(pct => (
              <Text key={`tl-${pct}`} style={{
                position: "absolute", left: 0, top: PAD_TOP + pct * plotH - 8,
                width: 32, textAlign: "right", fontSize: 9,
                color: theme.accent, fontWeight: "600",
              }}>
                {displayTemp(minT + (1 - pct) * (maxT - minT)).toFixed(0)}°
              </Text>
            ))}

            {/* Right Y-axis labels (humidity) */}
            {[0, 0.5, 1].map(pct => (
              <Text key={`hl-${pct}`} style={{
                position: "absolute", right: 0, top: PAD_TOP + pct * plotH - 8,
                width: 36, textAlign: "left", fontSize: 9,
                color: "#3B82F6", fontWeight: "600",
              }}>
                {(minH + (1 - pct) * (maxH - minH)).toFixed(0)}%
              </Text>
            ))}

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <View key={`g-${pct}`} style={{
                position: "absolute", left: PAD_LEFT, top: PAD_TOP + pct * plotH,
                width: plotW, height: 1,
                backgroundColor: pct === 0 || pct === 1 ? theme.line : theme.surfaceSoft,
              }} />
            ))}

            {/* Left axis spine */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: PAD_TOP,
              width: 1, height: plotH, backgroundColor: theme.line,
            }} />

            {/* Temp threshold */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: threshY,
              width: plotW, height: 1.5, backgroundColor: "#22C55E", opacity: 0.7,
            }} />
            <Text style={{
              position: "absolute", left: PAD_LEFT + 4, top: threshY - 13,
              fontSize: 8, fontWeight: "700", color: "#22C55E",
              backgroundColor: theme.surface, paddingHorizontal: 3,
            }}>
              {formatTemp(THRESHOLD_TEMP, 1)}
            </Text>

            {/* Humidity threshold */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: humThreshY,
              width: plotW, height: 1.5, backgroundColor: "#3B82F6", opacity: 0.6,
            }} />
            <Text style={{
              position: "absolute", right: PAD_RIGHT + 2, top: humThreshY - 13,
              fontSize: 8, fontWeight: "700", color: "#3B82F6",
              backgroundColor: theme.surface, paddingHorizontal: 3,
            }}>
              {THRESHOLD_HUM}%
            </Text>

            {/* Acceptable temperature range (min/max dashed lines) */}
            {[
              { y: tempAcceptMinY, value: TEMP_ACCEPT_MIN },
              { y: tempAcceptMaxY, value: TEMP_ACCEPT_MAX },
            ].map(({ y, value }) => (
              <React.Fragment key={`temp-accept-${value}`}>
                <View style={{
                  position: "absolute", left: PAD_LEFT, top: y,
                  width: plotW, height: 0, borderTopWidth: 1.5,
                  borderColor: theme.accent, borderStyle: "dashed", opacity: 0.6,
                }} />
                <Text style={{
                  position: "absolute", left: PAD_LEFT + 4, top: y + 2,
                  fontSize: 8, fontWeight: "700", color: theme.accent,
                  backgroundColor: theme.surface, paddingHorizontal: 3,
                }}>
                  {formatTemp(value, 0)}
                </Text>
              </React.Fragment>
            ))}

            {/* Acceptable humidity range (min/max dashed lines) */}
            {[
              { y: humAcceptMinY, value: HUM_ACCEPT_MIN },
              { y: humAcceptMaxY, value: HUM_ACCEPT_MAX },
            ].map(({ y, value }) => (
              <React.Fragment key={`hum-accept-${value}`}>
                <View style={{
                  position: "absolute", left: PAD_LEFT, top: y,
                  width: plotW, height: 0, borderTopWidth: 1.5,
                  borderColor: "#3B82F6", borderStyle: "dashed", opacity: 0.5,
                }} />
                <Text style={{
                  position: "absolute", right: PAD_RIGHT + 2, top: y + 2,
                  fontSize: 8, fontWeight: "700", color: "#3B82F6",
                  backgroundColor: theme.surface, paddingHorizontal: 3,
                }}>
                  {value}%
                </Text>
              </React.Fragment>
            ))}

            {/* Temperature line segments */}
            {tPts.slice(0, -1).map((p, i) => {
              const q = tPts[i + 1];
              const dx = q.x - p.x, dy = q.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View key={`tl-${i}`} style={{
                  position: "absolute",
                  left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - 2,
                  width: len, height: 3, backgroundColor: theme.accent, borderRadius: 2,
                  transform: [{ rotate: `${angle}deg` }],
                }} />
              );
            })}

            {/* Humidity line segments */}
            {hPts.slice(0, -1).map((p, i) => {
              const q = hPts[i + 1];
              const dx = q.x - p.x, dy = q.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View key={`hl-${i}`} style={{
                  position: "absolute",
                  left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - 2,
                  width: len, height: 3, backgroundColor: "#3B82F6", borderRadius: 2,
                  transform: [{ rotate: `${angle}deg` }],
                }} />
              );
            })}

            {/* Temperature dots */}
            {tPts.map((p, i) => (
              <Pressable key={`td-${i}`}
                onPress={() => selectPoint(p, "Temperature", i)}
                style={{
                  position: "absolute", left: p.x - 6, top: p.y - 6,
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: theme.accent, borderWidth: 2, borderColor: theme.surface,
                }}
              />
            ))}

            {/* Humidity dots */}
            {hPts.map((p, i) => (
              <Pressable key={`hd-${i}`}
                onPress={() => selectPoint(p, "Humidity", i)}
                style={{
                  position: "absolute", left: p.x - 6, top: p.y - 6,
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: "#3B82F6", borderWidth: 2, borderColor: theme.surface,
                }}
              />
            ))}

            {/* X-axis labels */}
            {tPts.map((p, i) => i % labelStep === 0 && (
              <Text key={`xl-${i}`} style={{
                position: "absolute", left: p.x - 16, top: PAD_TOP + plotH + 6,
                width: 32, textAlign: "center", fontSize: 8,
                color: theme.textMuted, fontWeight: "600",
              }}>
                {p.label}
              </Text>
            ))}

            {/* Tap outside tooltip to dismiss */}
            {selectedPoint && (
              <Pressable
                style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]}
                onPress={() => setSelectedPoint(null)}
              />
            )}

            {/* Tooltip */}
            {selectedPoint && (
              <View
                style={{
                  position: "absolute",
                  left: Math.min(Math.max(selectedPoint.x - 70, PAD_LEFT), chartWidth - 160),
                  top: Math.max(selectedPoint.y - (selectedPoint.hiveBreakdown ? 110 : 68), 4),
                  backgroundColor: theme.surface,
                  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                  borderWidth: 1, borderColor: theme.line,
                  elevation: 4, shadowColor: "#000", shadowOpacity: 0.1,
                  shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                  maxWidth: 155,
                  zIndex: 10,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: theme.primary }}>
                  {selectedPoint.type}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "700",
                  color: selectedPoint.type === "Temperature" ? theme.accent : "#3B82F6" }}>
                  {selectedPoint.type === "Temperature"
                    ? formatTemp(selectedPoint.value, 1) + " avg"
                    : `${selectedPoint.value.toFixed(0)} % avg`}
                </Text>
                <Text style={{ fontSize: 9, color: theme.textMuted, marginBottom: selectedPoint.hiveBreakdown ? 6 : 0 }}>
                  {selectedPoint.label}
                </Text>
                {selectedPoint.hiveBreakdown?.map((hive) => (
                  <View
                    key={hive.hiveName}
                    style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 3 }}
                  >
                    <Text
                      style={{ fontSize: 9, fontWeight: "700", color: theme.text, flex: 1 }}
                      numberOfLines={1}
                    >
                      {hive.hiveName}
                    </Text>
                    <Text style={{
                      fontSize: 9, fontWeight: "700",
                      color: selectedPoint.type === "Temperature" ? theme.accent : "#3B82F6",
                    }}>
                      {selectedPoint.type === "Temperature"
                        ? formatTemp(hive.value, 1)
                        : `${hive.value.toFixed(0)}%`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Stats row */}
      {series.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View style={{
            flex: 1, backgroundColor: theme.surfaceSoft, borderRadius: 8,
            padding: 8, borderWidth: 1, borderColor: theme.line,
          }}>
            <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "600", marginBottom: 4 }}>
              Temperature
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {["Min", "Avg", "Max"].map((lbl, i) => {
                const vals = [Math.min(...tempVals), tempVals.reduce((a, b) => a + b, 0) / tempVals.length, Math.max(...tempVals)];
                return (
                  <View key={lbl} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: theme.textMuted }}>{lbl}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.accent }}>
                      {formatTemp(vals[i], 1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{
            flex: 1, backgroundColor: theme.surfaceSoft, borderRadius: 8,
            padding: 8, borderWidth: 1, borderColor: theme.line,
          }}>
            <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "600", marginBottom: 4 }}>
              Humidity
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {["Min", "Avg", "Max"].map((lbl, i) => {
                const vals = [Math.min(...humVals), humVals.reduce((a, b) => a + b, 0) / humVals.length, Math.max(...humVals)];
                return (
                  <View key={lbl} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: theme.textMuted }}>{lbl}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#3B82F6" }}>
                      {vals[i].toFixed(0)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}