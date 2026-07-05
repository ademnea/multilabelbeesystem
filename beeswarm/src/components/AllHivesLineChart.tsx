/**
 * AllHivesLineChart
 *
 * Renders a combined temperature + humidity line chart for all hives
 * on the dashboard. Each hive gets its own coloured line.
 * Includes 24h / 7d / 30d range filter tabs.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

type MetricPoint = { timeLabel: string; temperatureC: number; humidityPercent: number };

type HiveHistory = {
  hiveId: string;
  history: MetricPoint[];
};

type TimeRange = "24h" | "7d" | "30d";
type Metric = "temperature" | "humidity";

const RANGE_LABELS: Record<TimeRange, string> = { "24h": "24 h", "7d": "7 d", "30d": "30 d" };
const RANGES: TimeRange[] = ["24h", "7d", "30d"];

// A palette of distinct colours for up to 10 hives
const HIVE_COLORS = [
  "#FFB268", "#3B82F6", "#22C55E", "#A855F7", "#EF4444",
  "#F59E0B", "#06B6D4", "#EC4899", "#84CC16", "#6366F1",
];

function sliceRange(history: MetricPoint[], range: TimeRange) {
  if (range === "24h") return history.slice(-24);
  if (range === "7d")  return history.slice(-168);
  return history;
}

type Props = {
  allHivesHistory: HiveHistory[];
};

export function AllHivesLineChart({ allHivesHistory }: Props) {
  const theme = useTheme();
  const [range,      setRange]      = useState<TimeRange>("24h");
  const [metric,     setMetric]     = useState<Metric>("temperature");
  const [chartWidth, setChartWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; hiveId: string; value: number; label: string;
  } | null>(null);
  const [hiddenHives, setHiddenHives] = useState<Set<string>>(new Set());

  const CHART_HEIGHT = 200;
  const PAD_TOP      = 16;
  const PAD_BOTTOM   = 28;
  const PAD_LEFT     = 36;
  const PAD_RIGHT    = 12;

  const sliced = useMemo(() =>
    allHivesHistory.map(h => ({ hiveId: h.hiveId, history: sliceRange(h.history, range) })),
    [allHivesHistory, range],
  );

  const allValues = useMemo(() => {
    const vals: number[] = [];
    sliced.forEach(h => h.history.forEach(p => {
      vals.push(metric === "temperature" ? p.temperatureC : p.humidityPercent);
    }));
    return vals;
  }, [sliced, metric]);

  const maxLen = Math.max(...sliced.map(h => h.history.length), 1);

  const minV = Math.min(...allValues, metric === "temperature" ? 24 : 0);
  const maxV = Math.max(...allValues, metric === "temperature" ? 38 : 100);

  const plotW = Math.max(chartWidth - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xOf  = (i: number, n: number) => PAD_LEFT + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yOf  = (v: number) => PAD_TOP + ((maxV - v) / (maxV - minV)) * plotH;

  const THRESHOLD = metric === "temperature" ? 34.5 : 65;
  const threshY   = yOf(THRESHOLD);
  const threshColour = metric === "temperature" ? "#22C55E" : "#3B82F6";

  if (allHivesHistory.length === 0) {
    return (
      <Text style={{ textAlign: "center", color: theme.textMuted, paddingVertical: 16 }}>
        No hive history data available.
      </Text>
    );
  }

  const labelStep = Math.max(1, Math.ceil(maxLen / 6));

  // X-axis labels from the first hive's history
  const xLabels = sliced[0]?.history.map(p => p.timeLabel) ?? [];

  return (
    <View style={{ marginTop: 8 }}>

      {/* Metric toggle */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        {(["temperature", "humidity"] as Metric[]).map(m => (
          <Pressable
            key={m}
            onPress={() => { setMetric(m); setTooltip(null); }}
            style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
              backgroundColor: metric === m ? theme.accent : theme.surfaceSoft,
              borderWidth: 1, borderColor: metric === m ? theme.accent : theme.line,
            }}
          >
            <Text style={{
              fontSize: 11, fontWeight: "700",
              color: metric === m ? theme.primary : theme.textMuted,
            }}>
              {m === "temperature" ? "Temperature" : "Humidity"}
            </Text>
          </Pressable>
        ))}

        {/* Range filter — right side */}
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 4 }}>
          {RANGES.map(r => (
            <Pressable key={r} onPress={() => { setRange(r); setTooltip(null); }}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                backgroundColor: range === r ? theme.primary : theme.surfaceSoft,
                borderWidth: 1, borderColor: range === r ? theme.primary : theme.line,
              }}
            >
              <Text style={{
                fontSize: 10, fontWeight: "700",
                color: range === r ? "#FFFFFF" : theme.textMuted,
              }}>
                {RANGE_LABELS[r]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Chart */}
      <View
        style={{ height: CHART_HEIGHT, position: "relative" }}
        onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <>
            {/* Y-axis labels */}
            {[0, 0.5, 1].map(pct => (
              <Text key={`yl-${pct}`} style={{
                position: "absolute", left: 0, top: PAD_TOP + pct * plotH - 8,
                width: 32, textAlign: "right", fontSize: 9,
                color: theme.textMuted, fontWeight: "600",
              }}>
                {(minV + (1 - pct) * (maxV - minV)).toFixed(0)}
                {metric === "temperature" ? "°" : "%"}
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

            {/* Y-axis spine */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: PAD_TOP,
              width: 1, height: plotH, backgroundColor: theme.line,
            }} />

            {/* Threshold line */}
            <View style={{
              position: "absolute", left: PAD_LEFT, top: threshY,
              width: plotW, height: 1.5, backgroundColor: threshColour, opacity: 0.6,
            }} />
            <Text style={{
              position: "absolute", left: PAD_LEFT + 4, top: threshY - 13,
              fontSize: 8, fontWeight: "700", color: threshColour,
              backgroundColor: theme.surface, paddingHorizontal: 3,
            }}>
              {metric === "temperature" ? `${THRESHOLD}°C` : `${THRESHOLD}%`}
            </Text>

            {/* Per-hive lines + dots */}
            {sliced.map((hive, hi) => {
              if (hiddenHives.has(hive.hiveId)) return null;
              const color = HIVE_COLORS[hi % HIVE_COLORS.length];
              const pts = hive.history.map((d, i) => ({
                x: xOf(i, hive.history.length),
                y: yOf(metric === "temperature" ? d.temperatureC : d.humidityPercent),
                label: d.timeLabel,
                value: metric === "temperature" ? d.temperatureC : d.humidityPercent,
              }));

              return (
                <React.Fragment key={hive.hiveId}>
                  {pts.slice(0, -1).map((p, i) => {
                    const q = pts[i + 1];
                    const dx = q.x - p.x, dy = q.y - p.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    return (
                      <View key={`line-${hi}-${i}`} style={{
                        position: "absolute",
                        left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - 1.5,
                        width: len, height: 3, backgroundColor: color, borderRadius: 1.5,
                        transform: [{ rotate: `${angle}deg` }], opacity: 0.85,
                      }} />
                    );
                  })}
                  {pts.map((p, i) => (
                    <Pressable key={`dot-${hi}-${i}`}
                      onPress={() => setTooltip({ x: p.x, y: p.y, hiveId: hive.hiveId, value: p.value, label: p.label })}
                      style={{
                        position: "absolute", left: p.x - 5, top: p.y - 5,
                        width: 10, height: 10, borderRadius: 5,
                        backgroundColor: color, borderWidth: 2, borderColor: theme.surface,
                      }}
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {/* X-axis labels */}
            {xLabels.map((lbl, i) => i % labelStep === 0 && (
              <Text key={`xl-${i}`} style={{
                position: "absolute",
                left: xOf(i, xLabels.length) - 16, top: PAD_TOP + plotH + 6,
                width: 32, textAlign: "center", fontSize: 8,
                color: theme.textMuted, fontWeight: "600",
              }}>
                {lbl}
              </Text>
            ))}

            {tooltip && (
              <Pressable
                style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]}
                onPress={() => setTooltip(null)}
              />
            )}

            {/* Tooltip */}
            {tooltip && (
              <View
                style={{
                  position: "absolute",
                  left: Math.min(Math.max(tooltip.x - 45, PAD_LEFT), chartWidth - 100),
                  top: Math.max(tooltip.y - 68, 4),
                  backgroundColor: theme.surface, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderWidth: 1, borderColor: theme.line, elevation: 4,
                  zIndex: 10,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: theme.primary }}>
                  {tooltip.hiveId}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.accent }}>
                  {metric === "temperature"
                    ? `${tooltip.value.toFixed(1)} °C`
                    : `${tooltip.value.toFixed(0)} %`}
                </Text>
                <Text style={{ fontSize: 9, color: theme.textMuted }}>{tooltip.label}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Hive colour legend — scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
      >
        {sliced.map((hive, hi) => {
          const color = HIVE_COLORS[hi % HIVE_COLORS.length];
          const hidden = hiddenHives.has(hive.hiveId);
          return (
            <Pressable key={hive.hiveId}
              onPress={() => setHiddenHives(prev => {
                const next = new Set(prev);
                hidden ? next.delete(hive.hiveId) : next.add(hive.hiveId);
                return next;
              })}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
                borderWidth: 1, borderColor: hidden ? theme.line : color,
                backgroundColor: hidden ? theme.surfaceSoft : `${color}15`,
                opacity: hidden ? 0.5 : 1,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ fontSize: 10, fontWeight: "700", color: hidden ? theme.textMuted : theme.primary }}>
                {hive.hiveId}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}