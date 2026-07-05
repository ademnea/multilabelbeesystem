import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  AmbientWeather,
  DashboardData,
  HiveStatus,
  fetchAmbientWeather,
  fetchDashboard,
} from "../../api";
import { THEME } from "../../theme";
import { useTheme } from "../../hooks/useTheme";
import { MainTabParamList } from "../../navigation/types";
import { createDashboardStyles } from "./DashboardScreen.styles";
import { DonutChart } from "../../components/DonutChart";
import { MetricCard } from "../../components/MetricCard";
import { AllHivesMetricsChart } from "../../components/AllHivesMetricsChart";
import { HiveMetricsLineChart } from "../../components/HiveMetricsLineChart";
import { HiveStatusTrendChart } from "../../components/HiveStatusTrendChart";
import { averageFleetMetrics } from "../../api/utils/metricsHistory";
import { useTemperatureUnit } from "../../hooks/useTemperatureUnit";
import { usePolling } from "../../hooks/usePolling";

type Props = BottomTabScreenProps<MainTabParamList, "Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [ambientWeather, setAmbientWeather] = useState<AmbientWeather | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const loadDashboard = useCallback(async (initial = false) => {
    // Clear stale dashboard cache so statusCounts are always fresh
    await import("../../api/utils/offlineCache").then(mod => mod.clearCache("dashboard"));
    if (initial) setLoading(true);
    setError(null);

    try {
      const [data, weather] = await Promise.allSettled([
        fetchDashboard(),
        fetchAmbientWeather(),
      ]);

      if (data.status === "fulfilled") {
        setDashboard(data.value);
      } else {
        // Promise.allSettled never rejects, so this is the only place a
        // fetchDashboard() failure surfaces — without this, the screen fell
        // back to a generic "No data returned from API" message that hid
        // the real cause (network error, auth failure, etc).
        setDashboard(currentDashboard => {
          if (!currentDashboard) {
            const reason = data.reason;
            setError(reason instanceof Error ? reason.message : "Could not load dashboard data");
          }
          return currentDashboard;
        });
      }

      setAmbientWeather(
        weather.status === "fulfilled" ? weather.value : null,
      );
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  const { isPolling, lastUpdated, executePoll } = usePolling({
    callback: loadDashboard,
    interval: 30000, // 30 seconds
    enabled: isPollingEnabled,
  });

  useFocusEffect(
    useCallback(() => {
      setIsPollingEnabled(true);
      void loadDashboard(true);
      return () => setIsPollingEnabled(false);
    }, [])
  );

  const onRefreshDashboard = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const fleetMetricSeries = useMemo(
    () => averageFleetMetrics(dashboard?.allHivesHistory ?? []),
    [dashboard?.allHivesHistory],
  );

  const { formatTemp, unit: tempUnit } = useTemperatureUnit();

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={styles.stateText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error || !dashboard) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Failed to load dashboard</Text>
        <Text style={styles.errorBody}>{error ?? "No data returned from API"}</Text>
        <Pressable style={styles.primaryButtonSmall} onPress={() => void loadDashboard()}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const total = dashboard.totalHives ?? 0;
  console.log("DASHBOARD: ",dashboard)

  const donutSegments: Array<{ pct: number; color: string; label: string; count: number; statusKey: HiveStatus }> = [
    { pct: dashboard.statusCounts.active / total, color: "#22C55E", label: "Harmonious", count: dashboard.statusCounts.active, statusKey: "active" },
    { pct: dashboard.statusCounts.swarming / total, color: "#EF4444", label: "Swarming", count: dashboard.statusCounts.swarming, statusKey: "swarming" },
    { pct: dashboard.statusCounts.quacking_queens / total, color: "#8B5CF6", label: "Multiple Queens", count: dashboard.statusCounts.quacking_queens, statusKey: "quacking_queens" },
    { pct: dashboard.statusCounts.pests / total, color: "#DC2626", label: "Pests", count: dashboard.statusCounts.pests, statusKey: "pests" },
    { pct: dashboard.statusCounts.queenless / total, color: "#EC4899", label: "Queenless", count: dashboard.statusCounts.queenless, statusKey: "queenless" },
    { pct: dashboard.statusCounts.external_noise / total, color: "#D97706", label: "External Noise", count: dashboard.statusCounts.external_noise, statusKey: "external_noise" },
    { pct: dashboard.statusCounts.inactive_hive / total, color: "#94A3B8", label: "Inactive", count: dashboard.statusCounts.inactive_hive, statusKey: "inactive_hive" },
    { pct: dashboard.statusCounts.Abscondment / total, color: "#6B7280", label: "Absconded", count: dashboard.statusCounts.Abscondment, statusKey: "Abscondment" },
    { pct: dashboard.statusCounts.unknown / total, color: "#64748B", label: "Unknown", count: dashboard.statusCounts.unknown, statusKey: "unknown" },
  ];

  // Only use dashboard metrics if they are not 0 and not undefined
  const useDashboardTemp = dashboard.keyMetrics.temperatureC !== undefined && dashboard.keyMetrics.temperatureC !== 0;
  const useDashboardHumidity = dashboard.keyMetrics.humidityPercent !== undefined && dashboard.keyMetrics.humidityPercent !== 0;
  const displayTemperature = ambientWeather?.temperatureC ?? (useDashboardTemp ? dashboard.keyMetrics.temperatureC : undefined);
  const displayHumidity = ambientWeather?.humidityPercent ?? (useDashboardHumidity ? dashboard.keyMetrics.humidityPercent : undefined);
  // If no ambient weather and no dashboard metrics, update subtitle
  const weatherSubtitle = 
    ambientWeather 
      ? "Live weather (Open-Meteo)" 
      : (useDashboardTemp || useDashboardHumidity) 
        ? "Last 24 hours" 
        : "No sensor data available yet";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.page }}
      contentContainerStyle={[styles.appPage, { backgroundColor: theme.page }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefreshDashboard()}
          colors={[THEME.accent]}
          tintColor={THEME.accent}
        />
      }
      
    >
      {/* ── Overview row ── */}
      <View style={styles.overviewCardRow}>
        <Pressable
          style={[styles.overviewTile, { backgroundColor: dashboard.silentHives.length > 0 ? "#152566" : "#36f57c" }]}
          onPress={() =>
            navigation.navigate("Hives", {
              screen: "HiveList",
              params: dashboard.silentHives.length > 0
                ? { hiveIds: dashboard.silentHives.map((h) => h.hiveId) }
                : undefined,
            })
          }
        >
          <Ionicons name={dashboard.silentHives.length > 0 ? "wifi-outline" : "radio-outline"} size={25} color="#fff" />
          <Text style={styles.overviewTileValue}>
            {dashboard.silentHives.length > 0 ? dashboard.silentHives.length : dashboard.totalHives}
          </Text>
          <Text style={styles.overviewTileLabel}>{dashboard.silentHives.length > 0 ? "Offline" : "All Online"}</Text>
        </Pressable>
        <Pressable
          style={[styles.overviewTile, { backgroundColor: "#5184f2" }]}
          onPress={() => navigation.navigate("Hives", { screen: "HiveList", params: { statusFilter: "active" } })}
        >
          <Ionicons name="checkmark-circle-outline" size={25} color="#fff" />
          <Text style={styles.overviewTileValue}>{dashboard.activeHives}</Text>
          <Text style={styles.overviewTileLabel}>Harmonious</Text>
        </Pressable>
        <Pressable
          style={[styles.overviewTile, { backgroundColor: "#f55858" }]}
          onPress={() => navigation.navigate("Alerts", { screen: "AlertsList" })}
        >
          <Ionicons name="alert-circle-outline" size={25} color="#fff" />
          <Text style={styles.overviewTileValue}>{dashboard.pendingAlerts}</Text>
          <Text style={styles.overviewTileLabel}>Alerts</Text>
        </Pressable>
        <Pressable
          style={[styles.overviewTile, { backgroundColor: "#f3ac5a" }]}
          onPress={() => navigation.navigate("Hives", { screen: "HiveList", params: { statusFilter: "swarming" } })}
        >
          <Ionicons name="warning-outline" size={25} color="#fff" />
          <Text style={styles.overviewTileValue}>{dashboard.statusCounts.swarming}</Text>
          <Text style={styles.overviewTileLabel}>Swarming</Text>
        </Pressable>
      </View>

      {/* ── Hive State Donut ── */}
      <Pressable style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate("Hives", { screen: "HiveList" })}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Hive State</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12, color: "#2563EB", fontWeight: "700" }}>View Hives</Text>
            <Ionicons name="chevron-forward" size={14} color="#2563EB" />
          </View>
        </View>
        <View style={styles.donutRow}>
          <DonutChart segments={donutSegments} total={total} />
          <View style={styles.donutLegend}>
            {donutSegments.map((seg) => (
              <Pressable
                key={seg.label}
                style={styles.donutLegendItem}
                onPress={() => navigation.navigate("Hives", { screen: "HiveList", params: { statusFilter: seg.statusKey } })}
              >
                <View style={[styles.donutLegendDot, { backgroundColor: seg.color }]} />
                <Text style={styles.donutLegendLabel}>{seg.label}</Text>
                <Text style={styles.donutLegendCount}>{seg.count}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>

        {/* ── All hives temp & humidity (same chart style as hive details) ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>All Hives — Temperature & Humidity</Text>
        <Text style={styles.metricsSubtitle}>
          Fleet average
          {(dashboard.allHivesHistory?.length ?? 0) > 0
            ? ` across ${dashboard.allHivesHistory!.length} hive${dashboard.allHivesHistory!.length === 1 ? "" : "s"}`
            : ""}
        </Text>
        {fleetMetricSeries.length > 0 ? (
          <HiveMetricsLineChart
            
            metricSeries={fleetMetricSeries}
            hiveName="fleet"
            perHiveSeries={dashboard.allHivesHistory?.map((h) => ({
              hiveId: h.hiveId,
              hiveName: h.hiveName ?? h.hiveId,
              history: h.history,
            }))}
          />
        ) : (
          <Text style={[styles.metricsSubtitle, { textAlign: "center", paddingVertical: 24 }]}>
            No hive sensor data yet. Create a hive to see fleet trends here.
          </Text>
        )}
      </View>

      {/* ── Hive Status Trend ── */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Hive Status Trend</Text>
          <Text style={{ fontSize: 10, color: THEME.textMuted, fontWeight: "600" }}>
            Live from DB
          </Text>
        </View>
        <Text style={[styles.metricsSubtitle, { marginBottom: 4 }]}>
          Status counts over time · tap chips to filter
        </Text>
        <HiveStatusTrendChart statusTrend={dashboard.statusTrend ?? []} />
      </View>

      {/* ── All Hives Snapshot Scatter ── */}
      {dashboard.allHives && dashboard.allHives.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Hive Metrics Snapshot</Text>
          </View>
          <Text style={styles.metricsSubtitle}>All hives plotted by temperature vs humidity</Text>
          <View style={styles.metricsLegendRow}>
            <View style={styles.metricsLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#DC2626", width: 8, height: 8 }]} />
              <Text style={styles.legendText}>Abnormal</Text>
            </View>
            <View style={styles.metricsLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22C55E", width: 8, height: 8 }]} />
              <Text style={styles.legendText}>Normal</Text>
            </View>
          </View>
          <AllHivesMetricsChart
            key={`snapshot-${tempUnit}`}
            allHives={dashboard.allHives}
          />
        </View>
      )}

      {/* ── Key Metrics ── */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.gridTwo}>
        <MetricCard 
          title="Avg Temperature" 
          value={displayTemperature !== undefined ? formatTemp(displayTemperature, 1).replace(`°${tempUnit}`, "") : "—"} 
          unit={displayTemperature !== undefined ? `°${tempUnit}` : ""} 
          subtitle={weatherSubtitle} 
        />
        <MetricCard 
          title="Avg Humidity" 
          value={displayHumidity !== undefined ? displayHumidity.toFixed(0) : "—"} 
          unit={displayHumidity !== undefined ? "%" : ""} 
          subtitle={weatherSubtitle} 
        />
      </View>

      <Text style={styles.sectionTitle}>System Monitoring</Text>
      

<View style={styles.gridThree}>
  {/* Recordings Today */}
  <Pressable
    style={styles.infoCard}
    onPress={() => {
      const hiveIds = dashboard.recordingsTodayDetails?.map((r) => r.hiveId);
      if (hiveIds && hiveIds.length > 0) {
        navigation.navigate("Hives", { screen: "HiveList", params: { hiveIds } });
      }
    }}
  >
    <Ionicons
      name="mic-outline"
      size={22}
      color={THEME.primary}
    />
    <Text style={styles.infoCardValue}>
      {dashboard.recordingsToday}
    </Text>
    <Text style={styles.infoCardLabel}>
      Recordings Today
    </Text>
    <Text style={styles.infoCardSub}>
      Across all hives
    </Text>
  </Pressable>

  {/* Silent Hives */}
  <Pressable
    style={[
      styles.infoCard,
      dashboard.silentHives.length > 0 &&
        styles.infoCardWarn,
    ]}
    onPress={() => {
      if (dashboard.silentHives.length > 0) {
        navigation.navigate("Hives", { screen: "HiveList", params: { hiveIds: dashboard.silentHives.map((h) => h.hiveId) } });
      }
    }}
  >
    <Ionicons
      name="volume-mute-outline"
      size={22}
      color={
        dashboard.silentHives.length > 0
          ? "#EF4444"
          : "#22C55E"
      }
    />

    <Text
      style={[
        styles.infoCardValue,
        {
          color:
            dashboard.silentHives.length > 0
              ? "#EF4444"
              : "#22C55E",
        },
      ]}
    >
      {dashboard.silentHives.length}
    </Text>

    <Text style={styles.infoCardLabel}>
      Silent Hives
    </Text>

    <Text style={styles.infoCardSub}>
      No audio in 8h+
    </Text>
  </Pressable>

  {/* Low Confidence */}
  <Pressable
    style={[
      styles.infoCard,
      dashboard.lowConfidenceInferences > 0 &&
        styles.infoCardWarn,
    ]}
    onPress={() => {
      const hiveIds = dashboard.lowConfidenceInferencesDetails?.map((r) => r.hiveId);
      if (hiveIds && hiveIds.length > 0) {
        navigation.navigate("Hives", { screen: "HiveList", params: { hiveIds } });
      }
    }}
  >
    <Ionicons
      name="help-circle-outline"
      size={22}
      color={
        dashboard.lowConfidenceInferences > 0
          ? "#EF4444"
          : "#22C55E"
      }
    />

    <Text
      style={[
        styles.infoCardValue,
        {
          color:
            dashboard.lowConfidenceInferences > 0
              ? "#EF4444"
              : "#22C55E",
        },
      ]}
    >
      {dashboard.lowConfidenceInferences}
    </Text>

    <Text style={styles.infoCardLabel}>
      Low Confidence
    </Text>

    <Text style={styles.infoCardSub}>
      Score &lt; 0.6
    </Text>
  </Pressable>
</View>
    </ScrollView>
  );
}