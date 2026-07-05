import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertSeverity } from "../api";
import { severityColor } from "../theme";

export function SeverityPill({ severity }: { severity: AlertSeverity }) {
  const color = severityColor(severity);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, { color }]}>{severity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontWeight: "800",
    fontSize: 12,
  },
});
