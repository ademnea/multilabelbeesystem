import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { HiveStatus } from "../api";
import { THEME } from "../theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendPoint = {
  timeLabel: string;
  recordedAt?: string;
  counts: Partial<Record<HiveStatus, number>>;
};

type Props = {
  statusTrend: TrendPoint[];
  /** ISO install date of the hive — used to disable range tabs the hive hasn't existed long enough to fill. */
  installationDate?: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_META: Array<{ status: HiveStatus; label: string; color: string }> = [
  { status: "active",          label: "Harmonious",     color: "#16A34A" },
  { status: "swarming",        label: "Swarming",        color: "#DC2626" },
  { status: "queenless",       label: "Queenless",       color: "#EC4899" },
  { status: "quacking_queens", label: "Multiple Queens", color: "#8B5CF6" },
  { status: "pests",           label: "Pests",           color: "#EF4444" },
  { status: "external_noise",  label: "External Noise",  color: "#D97706" },
  { status: "Abscondment",     label: "Absconded",       color: "#6B7280" },
  { status: "inactive_hive",   label: "Inactive",        color: "#94A3B8" },
  { status: "unknown",          label: "Unknown",          color: "#94A3B8" },
];

type Range = "24h" | "7d" | "30d";
const RANGES: Range[] = ["24h", "7d", "30d"];
const RANGE_MIN_DAYS: Record<Range, number> = { "24h": 0, "7d": 1, "30d": 7 };

/** 24h shows time-of-day; 7d/30d show the date, since multiple days are on screen. */
function labelFor(point: TrendPoint, range: Range): string {
  if (range === "24h" || !point.recordedAt) return point.timeLabel;
  const date = new Date(point.recordedAt);
  if (Number.isNaN(date.getTime())) return point.timeLabel;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Which ranges are actually meaningful given how long the hive has existed. */
function availableRanges(installationDate?: string): Range[] {
  if (!installationDate) return RANGES;
  const installedAt = new Date(installationDate).getTime();
  if (Number.isNaN(installedAt)) return RANGES;
  const daysSinceInstall = (Date.now() - installedAt) / (1000 * 60 * 60 * 24);
  return RANGES.filter((r) => daysSinceInstall >= RANGE_MIN_DAYS[r]);
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export function HiveStatusTrendChart({ statusTrend, installationDate }: Props) {
  const [range, setRange] = useState<Range>("7d");
  const [activeStatuses, setActiveStatuses] = useState<Set<HiveStatus>>(
    new Set(STATUS_META.map((m) => m.status)),
  );
  const [chartWidth, setChartWidth] = useState(0);

  const validRanges = useMemo(() => availableRanges(installationDate), [installationDate]);

  useEffect(() => {
    if (!validRanges.includes(range)) {
      setRange(validRanges[validRanges.length - 1] ?? "24h");
    }
  }, [validRanges, range]);

  // ── Slice data for selected range ─────────────────────────────────────────
  const slicedPoints = useMemo(() => {
    if (statusTrend.length === 0) return [];
    if (range === "24h") return statusTrend.slice(-24);
    if (range === "7d")  return statusTrend.slice(-7 * 24);
    return statusTrend; // 30d
  }, [statusTrend, range]);

  // Reduce density: show at most 30 labeled points on the x-axis
  const points = useMemo(() => {
    if (slicedPoints.length <= 30) return slicedPoints;
    const step = Math.ceil(slicedPoints.length / 30);
    return slicedPoints.filter((_, i) => i % step === 0);
  }, [slicedPoints]);

  // ── Which statuses actually have any data in this window ──────────────────
  const presentStatuses = useMemo(() => {
    const set = new Set<HiveStatus>();
    points.forEach((pt) => {
      (Object.keys(pt.counts) as HiveStatus[]).forEach((s) => {
        if ((pt.counts[s] ?? 0) > 0) set.add(s);
      });
    });
    return STATUS_META.filter((m) => set.has(m.status));
  }, [points]);

  const toggleStatus = (s: HiveStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size > 1) next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  };

  // ── Layout constants ──────────────────────────────────────────────────────
  const CHART_H   = 160;
  const PAD_TOP   = 22;
  const PAD_BOT   = 28;
  const PAD_H     = 14;
  const plotH     = CHART_H - PAD_TOP - PAD_BOT;
  const plotW     = Math.max(chartWidth - PAD_H * 2, 1);
  const n         = points.length;

  // Global max across all active statuses for y-scaling
  const globalMax = useMemo(() => {
    let m = 1;
    points.forEach((pt) => {
      activeStatuses.forEach((s) => {
        const v = pt.counts[s] ?? 0;
        if (v > m) m = v;
      });
    });
    return m;
  }, [points, activeStatuses]);

  const xOf = (i: number) =>
    PAD_H + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yOf = (v: number) =>
    PAD_TOP + (1 - v / globalMax) * plotH;

  // Label density
  const labelStep = Math.max(1, Math.ceil(n / 6));

  if (statusTrend.length === 0) {
    return (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: THEME.textMuted, fontWeight: "600" }}>
          No status trend data yet
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {/* ── Range tabs ──────────────────────────────────────────────────── */}
      {validRanges.length > 1 && (
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10, alignSelf: "flex-end" }}>
        {validRanges.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: range === r ? THEME.accent : THEME.surfaceSoft,
              borderWidth: 1,
              borderColor: range === r ? THEME.accent : THEME.line,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: "700",
              color: range === r ? THEME.primary : THEME.textMuted,
            }}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>
      )}

      {/* ── Status toggle chips ─────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", gap: 6, marginBottom: 10, paddingBottom: 2 }}
      >
        {presentStatuses.map(({ status, label, color }) => {
          const on = activeStatuses.has(status);
          return (
            <Pressable
              key={status}
              onPress={() => toggleStatus(status)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: on ? color : THEME.line,
                backgroundColor: on ? `${color}18` : THEME.surfaceSoft,
              }}
            >
              <View style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: on ? color : THEME.line,
              }} />
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: on ? color : THEME.textMuted,
              }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Chart canvas ────────────────────────────────────────────────── */}
      <View
        style={{ height: CHART_H, position: "relative" }}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && points.length > 0 && (
          <>
            {/* Grid lines */}
            {[0, 0.5, 1].map((pct) => (
              <View
                key={`grid-${pct}`}
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

            {/* Y-axis max label */}
            <Text style={{
              position: "absolute",
              left: 0,
              top: PAD_TOP - 8,
              width: PAD_H + 4,
              textAlign: "right",
              fontSize: 8,
              color: THEME.textMuted,
              fontWeight: "600",
            }}>
              {globalMax}
            </Text>

            {/* One line + dots per active status */}
            {STATUS_META.filter((m) => activeStatuses.has(m.status)).map(({ status, color }) => {
              const pts = points.map((pt, i) => ({
                x: xOf(i),
                y: yOf(pt.counts[status] ?? 0),
                v: pt.counts[status] ?? 0,
              }));

              return (
                <React.Fragment key={status}>
                  {/* Line segments */}
                  {pts.slice(0, -1).map((p, i) => {
                    const q = pts[i + 1];
                    const dx = q.x - p.x;
                    const dy = q.y - p.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    return (
                      <View
                        key={`seg-${status}-${i}`}
                        style={{
                          position: "absolute",
                          left: (p.x + q.x) / 2 - len / 2,
                          top: (p.y + q.y) / 2 - 1,
                          width: len,
                          height: 2,
                          backgroundColor: color,
                          borderRadius: 1,
                          opacity: 0.85,
                          transform: [{ rotate: `${angle}deg` }],
                        }}
                      />
                    );
                  })}

                  {/* Dots + value labels */}
                  {pts.map((p, i) => (
                    <React.Fragment key={`dot-${status}-${i}`}>
                      <View
                        style={{
                          position: "absolute",
                          left: p.x - 4,
                          top: p.y - 4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: color,
                          borderWidth: 1.5,
                          borderColor: "#FFFFFF",
                        }}
                      />
                      {p.v > 0 && (
                        <Text
                          style={{
                            position: "absolute",
                            left: p.x - 10,
                            top: p.y - 16,
                            width: 20,
                            textAlign: "center",
                            fontSize: 8,
                            fontWeight: "700",
                            color,
                          }}
                        >
                          {p.v}
                        </Text>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}

            {/* X-axis time labels */}
            {points.map((pt, i) =>
              i % labelStep === 0 ? (
                <Text
                  key={`xl-${i}`}
                  style={{
                    position: "absolute",
                    left: xOf(i) - 16,
                    top: PAD_TOP + plotH + 6,
                    width: 32,
                    textAlign: "center",
                    fontSize: 8,
                    color: THEME.textMuted,
                    fontWeight: "600",
                  }}
                >
                  {labelFor(pt, range)}
                </Text>
              ) : null,
            )}
          </>
        )}

        {chartWidth > 0 && points.length === 0 && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 12, color: THEME.textMuted, fontWeight: "600" }}>
              No data for this range
            </Text>
          </View>
        )}
      </View>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {presentStatuses.map(({ status, label, color }) => (
          <View key={status} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 12, height: 3, backgroundColor: color, borderRadius: 2 }} />
            <Text style={{ fontSize: 9, color: THEME.textMuted, fontWeight: "600" }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
