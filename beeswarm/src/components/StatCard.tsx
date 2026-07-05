import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../theme";

export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "49%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    padding: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.accent,
  },
  value: {
    fontSize: 28,
    color: THEME.primary,
    fontWeight: "800",
  },
});
