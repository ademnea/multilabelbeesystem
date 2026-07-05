import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Hive, fetchHives, fetchDashboard, enrichHivesWithCoordinates } from "../../api";
import { hasValidMapCoordinates } from "../../api/utils/normalizers";
import { useTemperatureUnit } from "../../hooks/useTemperatureUnit";
import { THEME, STATUS_COLOR } from "../../theme";
import { useTheme } from "../../hooks/useTheme";
import { useMapStyle } from "../../hooks/useMapStyle";
import { MainTabParamList } from "../../navigation/types";
import { mapStyles as styles } from "./MapScreen.styles";
import HiveMap from "../../components/HiveMap";
import type { MapHive } from "../../components/HiveMap.native";
import { usePolling } from "../../hooks/usePolling";

const DEFAULT_MAP_REGION = {
  latitude: 0.3476,
  longitude: 32.5825,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

function hasMapCoordinates(hive: Hive): hive is Hive & { latitude: number; longitude: number } {
  return hasValidMapCoordinates(hive.latitude, hive.longitude);
}

function getMapRegion(hives: MapHive[]) {
  if (hives.length === 0) return DEFAULT_MAP_REGION;
  const latitude = hives.reduce((sum, h) => sum + h.latitude, 0) / hives.length;
  const longitude = hives.reduce((sum, h) => sum + h.longitude, 0) / hives.length;
  return { latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
}


function LegendItem({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

type Props = BottomTabScreenProps<MainTabParamList, "Map">;

export function MapScreen({ navigation }: Props) {
  const theme = useTheme();
  const { satellite } = useMapStyle();
  const { unit: temperatureUnit } = useTemperatureUnit();
  const [hives, setHives] = useState<Hive[]>([]);
  const [sensorMap, setSensorMap] = useState<Record<string, { temperatureC: number; humidityPercent: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);

  const loadHives = useCallback(async (initial = false) => {
    // First, try to get cached data
    const [cachedHives, cachedDashboard] = await Promise.all([
      import("../../api/utils/offlineCache").then(mod => mod.getCachedData<any>("hives")),
      import("../../api/utils/offlineCache").then(mod => mod.getCachedData<any>("dashboard")),
    ]);
    
    if (cachedHives) {
      const withCoords = await enrichHivesWithCoordinates(cachedHives);
      setHives(withCoords);
      if (cachedDashboard?.allHives) {
        const map: Record<string, { temperatureC: number; humidityPercent: number }> = {};
        cachedDashboard.allHives.forEach((h: any) => {
          map[h.hiveId] = { temperatureC: h.temperatureC, humidityPercent: h.humidityPercent };
        });
        setSensorMap(map);
      }
      if (initial) setLoading(false);
    } else if (initial) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch hives and sensor snapshot in parallel
      const [data, dashboard] = await Promise.all([
        fetchHives(),
        fetchDashboard().catch(() => null),
      ]);
      const withCoords = await enrichHivesWithCoordinates(data);
      setHives(withCoords);

      // Build a lookup: hiveId → latest temp/humidity
      if (dashboard?.allHives) {
        const map: Record<string, { temperatureC: number; humidityPercent: number }> = {};
        dashboard.allHives.forEach((h) => {
          map[h.hiveId] = { temperatureC: h.temperatureC, humidityPercent: h.humidityPercent };
        });
        setSensorMap(map);
      }
    } catch (err) {
      // Only set error if we don't have any hives yet
      setHives(currentHives => {
        if (currentHives.length === 0) {
          setError(err instanceof Error ? err.message : "Could not load hive map data");
        }
        return currentHives;
      });
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  const { isPolling, lastUpdated } = usePolling({
    callback: loadHives,
    interval: 30000, // 30 seconds
    enabled: isPollingEnabled,
  });

  // Reload whenever this tab comes into focus — catches hives created elsewhere
  useFocusEffect(
    useCallback(() => {
      setIsPollingEnabled(true);
      void loadHives(true);
      return () => setIsPollingEnabled(false);
    }, [])
  );

  const mapHives = useMemo(
    () =>
      hives.filter(hasMapCoordinates).map((h) => ({
        ...h,
        temperatureC: sensorMap[h.id]?.temperatureC,
        humidityPercent: sensorMap[h.id]?.humidityPercent,
      })),
    [hives, sensorMap],
  );
  const region = useMemo(() => getMapRegion(mapHives), [mapHives]);
  // Hives without valid coordinates can't be pinned on the map — list them
  // explicitly instead of letting them silently disappear from this screen.
  const unmappedHives = useMemo(
    () => hives.filter((h) => !hasMapCoordinates(h)),
    [hives],
  );

  return (
    <View style={styles.fullScreenContainer}>
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Live Hive Map</Text>
            <Text style={styles.headerSubtitle}>
                {unmappedHives.length > 0
                  ? `${mapHives.length} of ${hives.length} hives mapped`
                  : `${mapHives.length} ${mapHives.length === 1 ? 'hive' : 'hives'} mapped`}
              </Text>
          </View>
          <Pressable style={styles.refreshButton} onPress={() => void loadHives()}>
            <Text style={styles.refreshButtonText}>⟳</Text>
          </Pressable>
        </View>
      </View>

      {/* Hives that couldn't be pinned (no valid coordinates) */}
      {!loading && unmappedHives.length > 0 && (
        <View style={styles.unmappedBanner}>
          <Text style={styles.unmappedBannerTitle}>
            {unmappedHives.length} hive{unmappedHives.length === 1 ? "" : "s"} missing a map location
          </Text>
          {unmappedHives.map((h) => (
            <Pressable
              key={h.id}
              style={styles.unmappedHiveRow}
              onPress={() => navigation.navigate("Hives", { screen: "EditHive", params: { hiveId: h.id } })}
            >
              <Text style={styles.unmappedHiveName} numberOfLines={1}>{h.name}</Text>
              <Text style={styles.unmappedHiveAction}>Add location</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={styles.loadingText}>Loading hive locations...</Text>
          </View>
        )}

        {!loading && mapHives.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Hives With Location Data</Text>
            <Text style={styles.emptyStateText}>
              Add latitude and longitude coordinates to your hives to see them on the map.
            </Text>
          </View>
        )}

        {!loading && mapHives.length > 0 && (
          <HiveMap
            mapHives={mapHives}
            region={region}
            statusColor={STATUS_COLOR}
            satellite={satellite}
            temperatureUnit={temperatureUnit}
            onMarkerPress={(hiveId: string) =>
              navigation.navigate("Hives", {
                screen: "HiveDetails",
                params: { hiveId },
              })
            }
          />
        )}

        {!!error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadHives()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Floating Legend */}
      {!loading && mapHives.length > 0 && (
        <View style={styles.floatingLegend}>
          <LegendItem color={STATUS_COLOR.active} text="Harmonious" />
          <LegendItem color={STATUS_COLOR.swarming} text="Swarming" />
          <LegendItem color={STATUS_COLOR.queenless} text="Queenless" />
          <LegendItem color={STATUS_COLOR.Abscondment} text="Absconded" />
        </View>
      )}
    </View>
  );
}