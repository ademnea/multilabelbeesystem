import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HiveStatus } from "../api";
import { STATUS_COLOR, displayStatus } from "../theme";

export function StatusPill({ status }: { status: HiveStatus }) {
  return (
    <View
      style={[styles.pill, { backgroundColor: `${STATUS_COLOR[status]}20` }]}
    >
      <Text style={[styles.text, { color: STATUS_COLOR[status] }]}>
        {displayStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
  },
});
