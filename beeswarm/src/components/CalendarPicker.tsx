/**
 * CalendarPicker — pure React Native calendar modal.
 * No external dependencies required.
 */
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../theme";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  visible: boolean;
  value: string;           // "YYYY-MM-DD" or ""
  onConfirm: (date: string) => void;
  onCancel: () => void;
  minDate?: string;        // "YYYY-MM-DD"
};

function parseYMD(s: string): { y: number; m: number; d: number } | null {
  const parts = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return null;
  return { y: +parts[1], m: +parts[2] - 1, d: +parts[3] };
}

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarPicker({ visible, value, onConfirm, onCancel, minDate }: Props) {
  const today = new Date();
  const initial = parseYMD(value);
  const [viewYear,  setViewYear]  = useState(initial?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial?.m ?? today.getMonth());
  const [selected,  setSelected]  = useState<string>(value || toYMD(today.getFullYear(), today.getMonth(), today.getDate()));

  const minParsed = parseYMD(minDate ?? "");

  function isDisabled(y: number, m: number, d: number): boolean {
    if (!minParsed) return false;
    if (y < minParsed.y) return true;
    if (y === minParsed.y && m < minParsed.m) return true;
    if (y === minParsed.y && m === minParsed.m && d < minParsed.d) return true;
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMo  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
        onPress={onCancel}
      >
        <Pressable
          style={{
            width: 320, backgroundColor: THEME.surface, borderRadius: 16,
            padding: 16, shadowColor: "#000", shadowOpacity: 0.2,
            shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
          }}
          onPress={() => {/* block backdrop close */}}
        >
          {/* Header: prev / month-year / next */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Pressable onPress={prevMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={20} color={THEME.primary} />
            </Pressable>
            <Text style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: "800", color: THEME.primary }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={nextMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={20} color={THEME.primary} />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            {DAYS_OF_WEEK.map(d => (
              <Text key={d} style={{
                flex: 1, textAlign: "center", fontSize: 11,
                fontWeight: "700", color: THEME.textMuted, paddingBottom: 4,
              }}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {Array.from({ length: cells.length / 7 }, (_, row) => (
            <View key={row} style={{ flexDirection: "row" }}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={{ flex: 1, height: 36 }} />;
                const dateStr  = toYMD(viewYear, viewMonth, day);
                const isToday  = dateStr === todayStr;
                const isSel    = dateStr === selected;
                const disabled = isDisabled(viewYear, viewMonth, day);
                return (
                  <Pressable
                    key={col}
                    onPress={() => !disabled && setSelected(dateStr)}
                    style={{
                      flex: 1, height: 36, alignItems: "center", justifyContent: "center",
                      borderRadius: 18,
                      backgroundColor: isSel ? THEME.accent : isToday ? `${THEME.accent}25` : "transparent",
                      opacity: disabled ? 0.3 : 1,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isSel || isToday ? "800" : "500",
                      color: isSel ? THEME.primary : isToday ? THEME.accent : THEME.text,
                    }}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Footer buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1, borderRadius: 8, borderWidth: 1,
                borderColor: THEME.line, paddingVertical: 11, alignItems: "center",
                backgroundColor: THEME.surfaceSoft,
              }}
            >
              <Text style={{ color: THEME.textMuted, fontWeight: "700", fontSize: 13 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(selected)}
              style={{
                flex: 1, borderRadius: 8, backgroundColor: THEME.accent,
                paddingVertical: 11, alignItems: "center",
              }}
            >
              <Text style={{ color: THEME.primary, fontWeight: "800", fontSize: 13 }}>Confirm</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
