import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HiveStatus } from "../api";
import { THEME } from "../theme";

type StatusEntry = {
  status: HiveStatus;
  label: string;
  count: number;
  color: string;
};

type Props = {
  statusCounts: Record<HiveStatus, number>;
  totalHives: number;
};

const STATUS_META: Array<{ status: HiveStatus; label: string; color: string }> = [
  { status: "active",          label: "Harmonious",      color: "#16A34A" },
  { status: "swarming",        label: "Swarming",         color: "#DC2626" },
  { status: "queenless",       label: "Queenless",        color: "#EC4899" },
  { status: "quacking_queens", label: "Multiple Queens",  color: "#8B5CF6" },
  { status: "pests",           label: "Pests",            color: "#EF4444" },
  { status: "external_noise",  label: "External Noise",   color: "#D97706" },
  { status: "Abscondment",     label: "Absconded",        color: "#6B7280" },
  { status: "inactive_hive",   label: "Inactive",         color: "#D97706" },
  { status: "unknown",          label: "Unknown",           color: "#94A3B8" },
];

export function HiveStatusChart({ statusCounts, totalHives }: Props) {
  const [selected, setSelected] = useState<HiveStatus | null>(null);

  const entries: StatusEntry[] = STATUS_META.map((m) => ({
    ...m,
    count: statusCounts[m.status] ?? 0,
  })).filter((e) => e.count > 0);

  if (entries.length === 0) {
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: THEME.textMuted, fontWeight: "600" }}>
          No hive status data yet
        </Text>
      </View>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const total = totalHives || 1;

  const selectedEntry = selected ? entries.find((e) => e.status === selected) ?? null : null;

  return (
    <View style={{ marginTop: 12 }}>
      {/* Bar chart */}
      <View style={{ gap: 8 }}>
        {entries.map((entry) => {
          const barPct = entry.count / maxCount;
          const isSelected = selected === entry.status;

          return (
            <Pressable
              key={entry.status}
              onPress={() => setSelected(isSelected ? null : entry.status)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {/* Label */}
              <Text
                style={{
                  width: 110,
                  fontSize: 10,
                  fontWeight: isSelected ? "800" : "600",
                  color: isSelected ? entry.color : THEME.textMuted,
                  textAlign: "right",
                }}
                numberOfLines={1}
              >
                {entry.label}
              </Text>

              {/* Bar track */}
              <View
                style={{
                  flex: 1,
                  height: 18,
                  backgroundColor: THEME.surfaceSoft,
                  borderRadius: 4,
                  overflow: "hidden",
                  borderWidth: isSelected ? 1.5 : 0,
                  borderColor: isSelected ? entry.color : "transparent",
                }}
              >
                <View
                  style={{
                    width: `${Math.round(barPct * 100)}%`,
                    height: "100%",
                    backgroundColor: entry.color,
                    opacity: isSelected ? 1 : 0.75,
                    borderRadius: 4,
                  }}
                />
              </View>

              {/* Count + pct */}
              <Text
                style={{
                  width: 38,
                  fontSize: 10,
                  fontWeight: "700",
                  color: isSelected ? entry.color : THEME.primary,
                  textAlign: "left",
                }}
              >
                {entry.count}
                <Text style={{ fontSize: 8, fontWeight: "500", color: THEME.textMuted }}>
                  {" "}({Math.round((entry.count / total) * 100)}%)
                </Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Detail callout for selected status */}
      {selectedEntry && (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: `${selectedEntry.color}14`,
            borderWidth: 1.5,
            borderColor: `${selectedEntry.color}40`,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: selectedEntry.color,
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: "800", color: selectedEntry.color }}>
              {selectedEntry.label}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: THEME.primary }}>
            {selectedEntry.count} hive{selectedEntry.count !== 1 ? "s" : ""}
            {" "}
            <Text style={{ fontSize: 11, fontWeight: "500", color: THEME.textMuted }}>
              ({Math.round((selectedEntry.count / total) * 100)}% of fleet)
            </Text>
          </Text>
        </View>
      )}

      {/* Footer: total */}
      <Text
        style={{
          marginTop: 10,
          fontSize: 10,
          color: THEME.textMuted,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {totalHives} total hive{totalHives !== 1 ? "s" : ""} · tap a bar for details
      </Text>
    </View>
  );
}
