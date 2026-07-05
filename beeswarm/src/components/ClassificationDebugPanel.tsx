import React, { useState } from "react";
import { View, StyleSheet, Pressable, Text, ScrollView } from "react-native";
import { usePredictionFetcher } from "../hooks/usePredictionFetcher";
import { CLASSIFICATION_TYPES } from "../utils/sampleClassificationData";
import { isMockApiEnabled } from "../api/mockPredictionApi";

interface ClassificationDebugPanelProps {
  hiveIds: string[];
  visible?: boolean;
}

const PANEL_THEME = {
  primary: "#001E37",
  accent: "#FFB268",
  surface: "#FFF5EA",
  line: "#DCE2EA",
  text: "#1F2A37",
  textMuted: "#667085",
};

/**
 * Debug panel for testing classification alerts
 * Remove this component once model integration is complete
 */
export function ClassificationDebugPanel({
  hiveIds,
  visible = true,
}: ClassificationDebugPanelProps) {
  const effectiveHiveIds = hiveIds.length > 0 ? hiveIds : ["Hive-001"];

  const {
    startFetching,
    stopFetching,
    fetchPredictions,
    fetchSinglePrediction,
    fetchSinglePredictionForClassification,
    predictions,
  } = usePredictionFetcher({
    hiveIds: effectiveHiveIds,
    enabled: false,
    interval: 15000,
    showAlerts: true,
  });

  const [isApiFetching, setIsApiFetching] = useState(false);
  const mockApiEnabled = isMockApiEnabled();

  const handleFetchSpecificPrediction = async (classification: string) => {
    setIsApiFetching(true);
    try {
      const prediction = await fetchSinglePredictionForClassification(
        effectiveHiveIds[0],
        classification,
      );
      console.log("Fetched prediction:", prediction);
    } catch (error) {
      console.error("Failed to fetch prediction:", error);
    } finally {
      setIsApiFetching(false);
    }
  };

  if (!visible) return null;

  const buttonStyle = StyleSheet.create({
    container: {
      padding: 10,
      backgroundColor: "#F8F9FB",
      borderTopWidth: 1,
      borderTopColor: PANEL_THEME.line,
    },
    section: {
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: PANEL_THEME.line,
      paddingBottom: 10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 8,
      color: PANEL_THEME.text,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginVertical: 5,
      borderRadius: 5,
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: PANEL_THEME.primary,
    },
    warningButton: {
      backgroundColor: PANEL_THEME.accent,
    },
    criticalButton: {
      backgroundColor: PANEL_THEME.primary,
    },
    infoButton: {
      backgroundColor: PANEL_THEME.accent,
    },
    text: {
      color: "white",
      fontWeight: "600",
      fontSize: 13,
    },
    smallText: {
      fontSize: 11,
      marginTop: 8,
      color: PANEL_THEME.textMuted,
    },
    badge: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: PANEL_THEME.surface,
      borderRadius: 4,
      marginTop: 8,
    },
    badgeText: {
      fontSize: 11,
      color: PANEL_THEME.text,
    },
  });

  return (
    <ScrollView style={buttonStyle.container}>
      <Text style={{ fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
        Classification Alert Simulator (Remove in Production)
      </Text>

      <View style={buttonStyle.section}>
        <Text style={buttonStyle.sectionTitle}>Direct Alert Simulation</Text>

        <Pressable
          style={[buttonStyle.button, buttonStyle.primaryButton]}
          onPress={() => fetchSinglePrediction(effectiveHiveIds[0])}
        >
          <Text style={buttonStyle.text}>Generate Random Alert</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.infoButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.HEALTHY)
          }
        >
          <Text style={buttonStyle.text}>Healthy Status</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.warningButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.PRESSWARM)
          }
        >
          <Text style={buttonStyle.text}>Pre-swarm Alert</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.criticalButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.SWARM)
          }
        >
          <Text style={buttonStyle.text}>Swarm Alert</Text>
        </Pressable>
      </View>

      <View style={buttonStyle.section}>
        <Text style={buttonStyle.sectionTitle}>Mock Prediction API</Text>

        <Pressable
          style={[buttonStyle.button, buttonStyle.primaryButton]}
          onPress={async () => {
            setIsApiFetching(true);
            try {
              await fetchPredictions();
            } finally {
              setIsApiFetching(false);
            }
          }}
          disabled={isApiFetching}
        >
          <Text style={buttonStyle.text}>
            {isApiFetching ? "Fetching..." : "Fetch All Predictions"}
          </Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.infoButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.HEALTHY)
          }
          disabled={isApiFetching}
        >
          <Text style={buttonStyle.text}>Get Healthy Prediction</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.warningButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.PRESSWARM)
          }
          disabled={isApiFetching}
        >
          <Text style={buttonStyle.text}>Get Pre-swarm Prediction</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, buttonStyle.criticalButton]}
          onPress={() =>
            handleFetchSpecificPrediction(CLASSIFICATION_TYPES.SWARM)
          }
          disabled={isApiFetching}
        >
          <Text style={buttonStyle.text}>Get Swarm Prediction</Text>
        </Pressable>

        <View style={buttonStyle.badge}>
          <Text style={buttonStyle.badgeText}>
            API Status:{" "}
            {mockApiEnabled ? "Mock (Testing)" : "Real (Production)"}
          </Text>
        </View>
      </View>

      <View style={buttonStyle.section}>
        <Text style={buttonStyle.sectionTitle}>Continuous Polling</Text>

        <Pressable
          style={[buttonStyle.button, { backgroundColor: PANEL_THEME.primary }]}
          onPress={() => startFetching()}
        >
          <Text style={buttonStyle.text}>Start Polling Predictions</Text>
        </Pressable>

        <Pressable
          style={[buttonStyle.button, { backgroundColor: PANEL_THEME.accent }]}
          onPress={() => stopFetching()}
        >
          <Text style={buttonStyle.text}>Stop Polling</Text>
        </Pressable>

        <Text style={buttonStyle.smallText}>
          Fetches predictions every 15 seconds
        </Text>
      </View>

      <View style={buttonStyle.section}>
        <Text style={buttonStyle.sectionTitle}>
          Recent Predictions: {predictions.length}
        </Text>

        {predictions.length === 0 ? (
          <Text style={buttonStyle.smallText}>
            No predictions yet. Tap "Fetch All Predictions" or any specific
            prediction button.
          </Text>
        ) : (
          predictions.slice(0, 3).map((pred) => (
            <View
              key={pred.id}
              style={{
                padding: 8,
                marginVertical: 4,
                backgroundColor: "#fff",
                borderLeftWidth: 3,
                borderLeftColor:
                  pred.severity === "Critical"
                    ? PANEL_THEME.primary
                    : pred.severity === "Warning"
                      ? PANEL_THEME.accent
                      : PANEL_THEME.primary,
                borderRadius: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600" }}>
                {pred.title}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: PANEL_THEME.textMuted,
                  marginTop: 2,
                }}
              >
                {pred.classification}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
