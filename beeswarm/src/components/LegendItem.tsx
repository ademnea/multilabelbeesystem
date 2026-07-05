import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function LegendItem({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  text: {
    color: "#475467",
    fontWeight: "600",
  },
});
