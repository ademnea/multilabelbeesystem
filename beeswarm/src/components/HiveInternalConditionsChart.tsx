import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useTemperatureUnit, convertTemp } from "../hooks/useTemperatureUnit";

type HiveConditionPoint = {
  timeLabel?: string;
  recorded_at: string;
  temp_honey?: number | null;
  temp_brood?: number | null;
  temp_exterior?: number | null;
  humidity_honey?: number | null;
  humidity_brood?: number | null;
  humidity_exterior?: number | null;
};

type TimeRange = "24h" | "7d" | "30d";

type Props = {
  conditions: HiveConditionPoint[];
  installationDate?: string;
};

const RANGE_LABELS: Record<TimeRange, string> = { "24h": "24 h", "7d": "7 d", "30d": "30 d" };
const RANGES: TimeRange[] = ["24h", "7d", "30d"];
const RANGE_MIN_DAYS: Record<TimeRange, number> = { "24h": 0, "7d": 1, "30d": 7 };

function availableRanges(installationDate?: string): TimeRange[] {
  if (!installationDate) return RANGES;
  const installedAt = new Date(installationDate).getTime();
  if (Number.isNaN(installedAt)) return RANGES;
  const daysSinceInstall = (Date.now() - installedAt) / (1000 * 60 * 60 * 24);
  return RANGES.filter((r) => daysSinceInstall >= RANGE_MIN_DAYS[r]);
}

function sliceForRange(series: HiveConditionPoint[], range: TimeRange): HiveConditionPoint[] {
  if (series.length === 0) return series;
  if (range === "24h") return series.slice(-48);
  if (range === "7d") return series.slice(-168);
  return series;
}

function labelFor(point: HiveConditionPoint, range: TimeRange): string {
  const date = new Date(point.recorded_at);
  if (Number.isNaN(date.getTime())) return "—";
  if (range === "24h") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

type SelectedPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
  type: string;
  index: number;
};

export function HiveInternalConditionsChart({
  conditions,
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

  const series = useMemo(() => sliceForRange(conditions, range), [conditions, range]);

  const selectPoint = (
    point: { x: number; y: number; value: number; label: string },
    type: string,
    index: number,
  ) => {
    setSelectedPoint({ ...point, type, index });
  };

  const CHART_HEIGHT = 220;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 32;
  const PAD_LEFT = 36;
  const PAD_RIGHT = 40;

  // Honey zone temp thresholds (healthy brood rearing temp ~32-36°C)
  const TEMP_MIN = 30;
  const TEMP_MAX = 38;
  const TEMP_ACCEPT_MIN = 32;
  const TEMP_ACCEPT_MAX = 36;

  // Brood zone humidity thresholds (healthy ~50-70%)
  const HUM_MIN = 30;
  const HUM_MAX = 90;
  const HUM_ACCEPT_MIN = 50;
  const HUM_ACCEPT_MAX = 70;

  if (series.length === 0) {
    return null;
  }

  // Extract valid temp_honey and humidity_brood values
  const tempVals = series
    .map(p => p.temp_honey)
    .filter((v): v is number => v != null);
  const humVals = series
    .map(p => p.humidity_brood)
    .filter((v): v is number => v != null);

  const maxT = Math.max(...tempVals, TEMP_MAX);
  const minT = Math.min(...tempVals, TEMP_MIN);
  const maxH = Math.max(...humVals, HUM_MAX);
  const minH = Math.min(...humVals, HUM_MIN);

  const n = series.length;
  const plotW = Math.max(chartWidth - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xOf = (i: number) => PAD_LEFT + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yT = (v: number) => PAD_TOP + ((maxT - v) / (maxT - minT)) * plotH;
  const yH = (v: number) => PAD_TOP + ((maxH - v) / (maxH - minH)) * plotH;

  const tPts = series.map((d, i) => ({
    x: xOf(i),
    y: d.temp_honey != null ? yT(d.temp_honey) : null,
    label: labelFor(d, range),
    value: d.temp_honey,
  }));
  const hPts = series.map((d, i) => ({
    x: xOf(i),
    y: d.humidity_brood != null ? yH(d.humidity_brood) : null,
    label: labelFor(d, range),
    value: d.humidity_brood,
  }));

  // Threshold positions
  const tempAcceptMinY = yT(TEMP_ACCEPT_MIN);
  const tempAcceptMaxY = yT(TEMP_ACCEPT_MAX);
  const humAcceptMinY = yH(HUM_ACCEPT_MIN);
  const humAcceptMaxY = yH(HUM_ACCEPT_MAX);

  // Decide which x-labels to show so they don't overlap
  const labelStep = Math.max(1, Math.ceil(n / 6));

  return (
    <View style={{ marginTop: 8 }}>
      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: "#F59E0B", borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Honey Temp</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: "#10B981", borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Brood Hum</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 12, height: 1.5, backgroundColor: "#EF4444", opacity: 0.7 }} />
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" }}>Critical Zone</Text>
        </View>
      </View>

      {/* Range filter */}
      {validRanges.length > 1 && (
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
          {validRanges.map(r => (
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
                color: range === r ? "#fff" : theme.textMuted,
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
                color: "#F59E0B", fontWeight: "600",
              }}>
                {displayTemp(minT + (1 - pct) * (maxT - minT)).toFixed(0)}°
              </Text>
            ))}

            {/* Right Y-axis labels (humidity) */}
            {[0, 0.5, 1].map(pct => (
              <Text key={`hl-${pct}`} style={{
                position: "absolute", right: 0, top: PAD_TOP + pct * plotH - 8,
                width: 36, textAlign: "left", fontSize: 9,
                color: "#10B981", fontWeight: "600",
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

            {/* Temperature critical zones (below 32 or above 36) */}
            {/* Too cold */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: tempAcceptMinY,
              width: plotW, height: (PAD_TOP + plotH) - tempAcceptMinY,
              backgroundColor: "#FEE2E2", opacity: 0.3,
            }} />
            {/* Too hot */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: PAD_TOP,
              width: plotW, height: tempAcceptMaxY - PAD_TOP,
              backgroundColor: "#FEE2E2", opacity: 0.3,
            }} />

            {/* Humidity critical zones (below 50 or above 70) */}
            {/* Too dry */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: humAcceptMaxY,
              width: plotW, height: (PAD_TOP + plotH) - humAcceptMaxY,
              backgroundColor: "#FFFBEB", opacity: 0.3,
            }} />
            {/* Too humid */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: PAD_TOP,
              width: plotW, height: humAcceptMinY - PAD_TOP,
              backgroundColor: "#FFFBEB", opacity: 0.3,
            }} />

            {/* Left axis spine */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: PAD_TOP,
              width: 1, height: plotH, backgroundColor: theme.line,
            }} />

            {/* Acceptable temperature range lines */}
            {[
              { y: tempAcceptMinY, value: TEMP_ACCEPT_MIN, label: "Min" },
              { y: tempAcceptMaxY, value: TEMP_ACCEPT_MAX, label: "Max" },
            ].map(({ y, value, label }) => (
              <React.Fragment key={`temp-accept-${value}`}>
                <View style={{
                  position: "absolute", left: PAD_LEFT, top: y,
                  width: plotW, height: 1.5, borderTopWidth: 1.5,
                  borderColor: "#F59E0B", borderStyle: "dashed", opacity: 0.8,
                }} />
                <Text style={{
                  position: "absolute", left: PAD_LEFT + 4, top: y - 12,
                  fontSize: 8, fontWeight: "700", color: "#F59E0B",
                  backgroundColor: theme.surface, paddingHorizontal: 3,
                }}>
                  {formatTemp(value, 0)}°
                </Text>
              </React.Fragment>
            ))}

            {/* Acceptable humidity range lines */}
            {[
              { y: humAcceptMinY, value: HUM_ACCEPT_MIN, label: "Min" },
              { y: humAcceptMaxY, value: HUM_ACCEPT_MAX, label: "Max" },
            ].map(({ y, value, label }) => (
              <React.Fragment key={`hum-accept-${value}`}>
                <View style={{
                  position: "absolute", left: PAD_LEFT, top: y,
                  width: plotW, height: 1.5, borderTopWidth: 1.5,
                  borderColor: "#10B981", borderStyle: "dashed", opacity: 0.8,
                }} />
                <Text style={{
                  position: "absolute", right: PAD_RIGHT + 2, top: y - 12,
                  fontSize: 8, fontWeight: "700", color: "#10B981",
                  backgroundColor: theme.surface, paddingHorizontal: 3,
                }}>
                  {value}%
                </Text>
              </React.Fragment>
            ))}

            {/* Temperature line segments (honey zone) */}
            {tPts.slice(0, -1).map((p, i) => {
              if (p.y == null) return null;
              const q = tPts[i + 1];
              if (q.y == null) return null;
              const dx = q.x - p.x, dy = q.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View key={`tl-${i}`} style={{
                  position: "absolute",
                  left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - 2,
                  width: len, height: 3, backgroundColor: "#F59E0B", borderRadius: 2,
                  transform: [{ rotate: `${angle}deg` }],
                }} />
              );
            })}

            {/* Humidity line segments (brood zone) */}
            {hPts.slice(0, -1).map((p, i) => {
              if (p.y == null) return null;
              const q = hPts[i + 1];
              if (q.y == null) return null;
              const dx = q.x - p.x, dy = q.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View key={`hl-${i}`} style={{
                  position: "absolute",
                  left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - 2,
                  width: len, height: 3, backgroundColor: "#10B981", borderRadius: 2,
                  transform: [{ rotate: `${angle}deg` }],
                }} />
              );
            })}

            {/* Temperature dots */}
            {tPts.map((p, i) => p.y != null && p.value != null && (
              <Pressable key={`td-${i}`}
                onPress={() => selectPoint({ ...p, y: p.y as number, value: p.value as number }, "Honey Temp", i)}
                style={{
                  position: "absolute", left: p.x - 5, top: p.y - 5,
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: "#F59E0B", borderWidth: 2, borderColor: theme.surface,
                }}
              />
            ))}

            {/* Humidity dots */}
            {hPts.map((p, i) => p.y != null && p.value != null && (
              <Pressable key={`hd-${i}`}
                onPress={() => selectPoint({ ...p, y: p.y as number, value: p.value as number }, "Brood Hum", i)}
                style={{
                  position: "absolute", left: p.x - 5, top: p.y - 5,
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: "#10B981", borderWidth: 2, borderColor: theme.surface,
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
                  left: Math.min(Math.max(selectedPoint.x - 65, PAD_LEFT), chartWidth - 150),
                  top: Math.max(selectedPoint.y - 65, 4),
                  backgroundColor: theme.surface,
                  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                  borderWidth: 1, borderColor: theme.line,
                  elevation: 4, shadowColor: "#000", shadowOpacity: 0.1,
                  shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                  maxWidth: 140,
                  zIndex: 10,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: theme.primary }}>
                  {selectedPoint.type}
                </Text>
                <Text style={{
                  fontSize: 14, fontWeight: "700",
                  color: selectedPoint.type === "Honey Temp" ? "#F59E0B" : "#10B981"
                }}>
                  {selectedPoint.type === "Honey Temp"
                    ? formatTemp(selectedPoint.value, 1)
                    : `${selectedPoint.value.toFixed(0)} %`}
                </Text>
                <Text style={{ fontSize: 9, color: theme.textMuted }}>
                  {selectedPoint.label}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Stats row */}
      {tempVals.length > 0 && humVals.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View style={{
            flex: 1, backgroundColor: theme.surfaceSoft, borderRadius: 8,
            padding: 8, borderWidth: 1, borderColor: theme.line,
          }}>
            <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "600", marginBottom: 4 }}>
              Honey Temp
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {["Min", "Avg", "Max"].map((lbl, i) => {
                const vals = [
                  Math.min(...tempVals),
                  tempVals.reduce((a, b) => a + b, 0) / tempVals.length,
                  Math.max(...tempVals),
                ];
                return (
                  <View key={lbl} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: theme.textMuted }}>{lbl}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#F59E0B" }}>
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
              Brood Hum
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {["Min", "Avg", "Max"].map((lbl, i) => {
                const vals = [
                  Math.min(...humVals),
                  humVals.reduce((a, b) => a + b, 0) / humVals.length,
                  Math.max(...humVals),
                ];
                return (
                  <View key={lbl} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: theme.textMuted }}>{lbl}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#10B981" }}>
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
