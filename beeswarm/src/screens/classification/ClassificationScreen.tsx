import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ClassificationDebugPanel } from "../../components/ClassificationDebugPanel";
import { classificationStyles as styles } from "./ClassificationScreen.styles";

const DEBUG_HIVE_IDS = ["Hive-001", "Hive-002", "Hive-003"];

export function ClassificationScreen() {
  return (
    <ScrollView contentContainerStyle={styles.appPage}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Classification API Simulator</Text>
        <Text style={styles.metricSubtitle}>
          Use this page to test prediction alerts without cluttering the dashboard.
        </Text>
      </View>
      <ClassificationDebugPanel hiveIds={DEBUG_HIVE_IDS} visible />
    </ScrollView>
  );
}
