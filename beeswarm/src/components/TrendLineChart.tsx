import React, { useState } from "react";
import { Text, View } from "react-native";
import { THEME } from "../theme";

type DataPoint = { label: string; count: number };

type Props = {
  data: DataPoint[];
};

export function TrendLineChart({ data }: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const CHART_HEIGHT = 140;
  const PAD_TOP = 22;
  const PAD_BOTTOM = 26;
  const PAD_H = 14;

  const max = Math.max(...data.map((d) => d.count), 1);
  const n = data.length;
  const plotW = Math.max(chartWidth - PAD_H * 2, 1);
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const pts = data.map((d, i) => ({
    x: PAD_H + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2),
    y: PAD_TOP + (1 - d.count / max) * plotH,
    label: d.label,
    count: d.count,
  }));

  return (
    <View
      style={{ height: CHART_HEIGHT, marginTop: 12 }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {chartWidth > 0 && (
        <>
          {[0, 0.5, 1].map((pct) => (
            <View
              key={pct}
              style={{
                position: "absolute",
                left: PAD_H,
                top: PAD_TOP + pct * plotH,
                width: plotW,
                height: 1,
                backgroundColor: "#F1F5F9",
              }}
            />
          ))}
          {pts.slice(0, -1).map((p, i) => {
            const q = pts[i + 1];
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: (p.x + q.x) / 2 - len / 2,
                  top: (p.y + q.y) / 2 - 1,
                  width: len,
                  height: 2,
                  backgroundColor: THEME.accent,
                  borderRadius: 1,
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })}
          {pts.map((p, i) => (
            <React.Fragment key={`dot-${i}`}>
              <View
                style={{
                  position: "absolute",
                  left: p.x - 5,
                  top: p.y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: THEME.accent,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                }}
              />
              <Text
                style={{
                  position: "absolute",
                  left: p.x - 12,
                  top: p.y - 19,
                  width: 24,
                  textAlign: "center",
                  fontSize: 9,
                  fontWeight: "700",
                  color: THEME.primary,
                }}
              >
                {p.count}
              </Text>
            </React.Fragment>
          ))}
          {pts.map((p, i) => (
            <Text
              key={`lbl-${i}`}
              style={{
                position: "absolute",
                left: p.x - 16,
                top: PAD_TOP + plotH + 6,
                width: 32,
                textAlign: "center",
                fontSize: 9,
                color: THEME.textMuted,
                fontWeight: "600",
              }}
            >
              {p.label}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}
