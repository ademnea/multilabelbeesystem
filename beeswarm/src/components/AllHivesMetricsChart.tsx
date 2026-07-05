import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { THEME } from "../theme";
import { useTemperatureUnit, convertTemp } from "../hooks/useTemperatureUnit";

type HivePoint = {
  hiveId: string;
  hiveName: string;
  temperatureC: number;
  humidityPercent: number;
};

type Props = {
  allHives: HivePoint[];
};

type Category = "healthy" | "atRisk" | "total";

export function AllHivesMetricsChart({ allHives }: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const [hoveredHive, setHoveredHive] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);
  const { formatTemp, unit: tempUnit } = useTemperatureUnit();

  const CHART_HEIGHT = 280;
  const PAD_LEFT = 50;
  const PAD_RIGHT = 20;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 50;
  const THRESHOLD_TEMP = 34.5; // always in °C for logic
  const THRESHOLD_HUMIDITY = 65;

  // Convert all temperatures to the display unit for axis scaling.
  // Filter out non-finite values so one hive with missing data can't turn
  // Math.max/min (and the whole axis) into NaN for every other hive.
  const displayTemps = allHives
    .map((h) => convertTemp(h.temperatureC, tempUnit))
    .filter((t) => Number.isFinite(t));
  const thresholdDisplay = convertTemp(THRESHOLD_TEMP, tempUnit);

  const maxTemp = Math.max(...displayTemps, convertTemp(40, tempUnit));
  const minTemp = Math.min(...displayTemps, convertTemp(25, tempUnit));

  const plotW = Math.max(chartWidth - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const isAbnormal = (h: HivePoint) => h.temperatureC > THRESHOLD_TEMP || h.humidityPercent > THRESHOLD_HUMIDITY;
  const healthyHives = allHives.filter((h) => !isAbnormal(h));
  const atRiskHives = allHives.filter(isAbnormal);
  const categoryHives: Record<Category, HivePoint[]> = {
    healthy: healthyHives,
    atRisk: atRiskHives,
    total: allHives,
  };

  return (
    <View key={`snapshot-${tempUnit}`} style={{ marginTop: 12 }}>
      <View
        style={{ height: CHART_HEIGHT, position: "relative" }}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <>
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map((val) => (
              <Text key={`y-label-${val}`} style={{ position: "absolute", right: plotW + PAD_LEFT + 8, top: PAD_TOP + (1 - val / 100) * plotH - 8, width: 35, textAlign: "right", fontSize: 9, color: THEME.textMuted, fontWeight: "500" }}>
                {val}%
              </Text>
            ))}
            <Text style={{ position: "absolute", left: 2, top: PAD_TOP + plotH / 2 - 40, fontSize: 11, fontWeight: "700", color: THEME.textMuted }}>
              Humidity
            </Text>
            {/* X-axis labels */}
            {[minTemp, (minTemp + maxTemp) / 2, maxTemp].map((val, idx) => (
              <Text key={`x-label-${idx}`} style={{ position: "absolute", left: PAD_LEFT + (idx / 2) * plotW - 14, bottom: 8, fontSize: 9, color: THEME.textMuted, fontWeight: "500" }}>
                {val.toFixed(0)}°{tempUnit}
              </Text>
            ))}
            <Text style={{ position: "absolute", left: PAD_LEFT + plotW / 2 - 40, bottom: 18, fontSize: 11, fontWeight: "700", color: THEME.textMuted }}>
              Temperature
            </Text>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <React.Fragment key={`grid-${pct}`}>
                <View style={{ position: "absolute", left: PAD_LEFT + pct * plotW, top: PAD_TOP, width: 1, height: plotH, backgroundColor: pct === 0 || pct === 1 ? "#D1D5DB" : "#E5E7EB" }} />
                <View style={{ position: "absolute", left: PAD_LEFT, top: PAD_TOP + pct * plotH, width: plotW, height: 1, backgroundColor: pct === 0 || pct === 1 ? "#D1D5DB" : "#E5E7EB" }} />
              </React.Fragment>
            ))}
            {/* Normal zone */}
            <View style={{ position: "absolute", left: PAD_LEFT, top: PAD_TOP + (1 - THRESHOLD_HUMIDITY / 100) * plotH, width: ((thresholdDisplay - minTemp) / (maxTemp - minTemp)) * plotW, height: (THRESHOLD_HUMIDITY / 100) * plotH, backgroundColor: "#22C55E", opacity: 0.1, borderWidth: 2, borderColor: "#22C55E", borderStyle: "dashed" }} />
            {/* Threshold lines */}
            <View style={{ position: "absolute", left: PAD_LEFT + ((thresholdDisplay - minTemp) / (maxTemp - minTemp)) * plotW, top: PAD_TOP, width: 2, height: plotH, backgroundColor: "#FFB268", opacity: 0.7 }} />
            <View style={{ position: "absolute", left: PAD_LEFT, top: PAD_TOP + (1 - THRESHOLD_HUMIDITY / 100) * plotH, width: plotW, height: 2, backgroundColor: "#60A5FA", opacity: 0.7 }} />
            <Text style={{ position: "absolute", left: PAD_LEFT + ((thresholdDisplay - minTemp) / (maxTemp - minTemp)) * plotW - 18, top: PAD_TOP - 18, fontSize: 8, fontWeight: "700", color: "#FFB268", backgroundColor: "#FFFFFF", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 }}>
              {thresholdDisplay.toFixed(1)}°{tempUnit}
            </Text>
            <Text style={{ position: "absolute", right: PAD_RIGHT, top: PAD_TOP + (1 - THRESHOLD_HUMIDITY / 100) * plotH - 16, fontSize: 8, fontWeight: "700", color: "#60A5FA", backgroundColor: "#FFFFFF", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 }}>
              65%
            </Text>
            {/* Tap outside to dismiss tooltip */}
            {hoveredHive && (
              <Pressable
                style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}
                onPress={() => setHoveredHive(null)}
              />
            )}

            {/* Hive dots — rendered above the dismiss overlay */}
            {allHives.map((hive) => {
              const displayT = convertTemp(hive.temperatureC, tempUnit);
              const x = PAD_LEFT + ((displayT - minTemp) / (maxTemp - minTemp)) * plotW;
              const y = PAD_TOP + (1 - hive.humidityPercent / 100) * plotH;
              const color = isAbnormal(hive) ? "#DC2626" : "#22C55E";
              const isHovered = hoveredHive === hive.hiveId;

              // Clamp tooltip so it stays inside the chart bounds
              const tooltipW = 120;
              const tooltipLeft = Math.min(
                Math.max(x - tooltipW / 2, PAD_LEFT),
                chartWidth - PAD_RIGHT - tooltipW,
              );
              const tooltipTop = y - 74 < PAD_TOP ? y + 16 : y - 74;

              return (
                <React.Fragment key={hive.hiveId}>
                  <Pressable
                    onPress={() => setHoveredHive(isHovered ? null : hive.hiveId)}
                    onHoverIn={() => setHoveredHive(hive.hiveId)}
                    onHoverOut={() => setHoveredHive(null)}
                    style={{
                      position: "absolute",
                      left: x - 12,
                      top: y - 12,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: isHovered ? 20 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: isHovered ? 20 : 16,
                        height: isHovered ? 20 : 16,
                        borderRadius: 10,
                        backgroundColor: color,
                        borderWidth: 3,
                        borderColor: "#FFFFFF",
                      }}
                    />
                  </Pressable>
                  {isHovered && (
                    <View
                      style={{
                        position: "absolute",
                        left: tooltipLeft,
                        top: tooltipTop,
                        width: tooltipW,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        backgroundColor: "#1E293B",
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: color,
                        zIndex: 99,
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 6,
                      }}
                    >
                      {/* Hive name */}
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: "#FFFFFF",
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {hive.hiveName || hive.hiveId}
                      </Text>
                      {/* Temperature row */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F97316" }} />
                        <Text style={{ fontSize: 10, color: "#F97316", fontWeight: "700" }}>
                          {formatTemp(hive.temperatureC, 1)}
                        </Text>
                        {hive.temperatureC > THRESHOLD_TEMP && (
                          <Text style={{ fontSize: 8, color: "#FCA5A5", fontWeight: "600" }}>↑ high</Text>
                        )}
                      </View>
                      {/* Humidity row */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#60A5FA" }} />
                        <Text style={{ fontSize: 10, color: "#60A5FA", fontWeight: "700" }}>
                          {hive.humidityPercent.toFixed(0)}%
                        </Text>
                        {hive.humidityPercent > THRESHOLD_HUMIDITY && (
                          <Text style={{ fontSize: 8, color: "#93C5FD", fontWeight: "600" }}>↑ high</Text>
                        )}
                      </View>
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}
      </View>

      {/* Summary */}
      <View style={{ marginTop: 16, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#ECFDF5", borderRadius: 6 }}
            onPress={() => setExpandedCategory(expandedCategory === "healthy" ? null : "healthy")}
          >
            <Text style={{ fontSize: 9, color: THEME.textMuted, fontWeight: "600" }}>Healthy</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#22C55E", marginTop: 4 }}>
              {healthyHives.length}
            </Text>
          </Pressable>
          <Pressable
            style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#FCE7E7", borderRadius: 6 }}
            onPress={() => setExpandedCategory(expandedCategory === "atRisk" ? null : "atRisk")}
          >
            <Text style={{ fontSize: 9, color: THEME.textMuted, fontWeight: "600" }}>At Risk</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#DC2626", marginTop: 4 }}>
              {atRiskHives.length}
            </Text>
          </Pressable>
          <Pressable
            style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#F0F4F8", borderRadius: 6 }}
            onPress={() => setExpandedCategory(expandedCategory === "total" ? null : "total")}
          >
            <Text style={{ fontSize: 9, color: THEME.textMuted, fontWeight: "600" }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: THEME.primary, marginTop: 4 }}>{allHives.length}</Text>
          </Pressable>
        </View>

        {expandedCategory && (
          <View style={{ marginTop: 10, gap: 6 }}>
            {categoryHives[expandedCategory].length === 0 ? (
              <Text style={{ fontSize: 11, color: THEME.textMuted, fontStyle: "italic" }}>No hives in this category.</Text>
            ) : (
              categoryHives[expandedCategory].map((h) => (
                <View
                  key={h.hiveId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    backgroundColor: THEME.surfaceSoft,
                    borderRadius: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isAbnormal(h) ? "#DC2626" : "#22C55E" }} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: THEME.text }}>{h.hiveName || h.hiveId}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: THEME.textMuted }}>
                    {formatTemp(h.temperatureC, 1)} · {h.humidityPercent.toFixed(0)}%
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );
}
