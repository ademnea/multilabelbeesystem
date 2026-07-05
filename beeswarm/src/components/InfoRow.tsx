import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { THEME } from "../theme";

export function InfoRow({
  label,
  value,
  valueColor = "#1F2A37",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.line,
  },
  label: {
    color: "#667085",
    fontWeight: "700",
  },
  value: {
    fontWeight: "800",
  },
});
