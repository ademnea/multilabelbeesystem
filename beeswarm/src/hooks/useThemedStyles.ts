/**
 * Re-creates StyleSheet when theme changes (dark/light toggle).
 */
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "./useTheme";

type Theme = ReturnType<typeof useTheme>;

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  creator: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(creator(theme)), [theme]);
}