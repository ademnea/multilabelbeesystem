import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
};

export function MetricCard({ title, value, unit, subtitle }: Props) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        metricCard: {
          width: "49%",
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.line,
          borderRadius: 12,
          padding: 12,
        },
        metricTitle: {
          fontSize: 12,
          color: theme.accent,
          fontWeight: "700",
          marginBottom: 8,
        },
        metricValue: {
          fontSize: 32,
          color: theme.primary,
          fontWeight: "800",
        },
        metricUnit: {
          fontSize: 16,
          color: theme.primary,
          fontWeight: "700",
        },
        metricSubtitle: {
          fontSize: 11,
          color: theme.textMuted,
          marginTop: 6,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>
        {value}
        <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}