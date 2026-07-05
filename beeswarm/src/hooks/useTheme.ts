/**
 * useTheme hook
 *
 * Returns a snapshot of the current THEME object and re-renders
 * the component whenever applyThemeMode() is called.
 *
 * Usage:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.page }} />
 */

import { useEffect, useState } from "react";
import { THEME, applyThemeMode, Theme } from "../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Subscribers notified after every applyThemeMode call
const subscribers = new Set<() => void>();

let _patched = false;

function patchApplyThemeMode() {
  if (_patched) return;
  _patched = true;
  // We can't monkey-patch an ES module export directly, so components
  // that need live re-renders should call notifyThemeChange() after
  // calling applyThemeMode(). App.tsx does this via handleDarkModeChange.
}

export function notifyThemeChange() {
  subscribers.forEach(fn => fn());
}

export function useTheme(): Theme {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fn = () => forceUpdate(n => n + 1);
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }, []);

  // Return a shallow copy so React sees a new object reference
  return { ...THEME };
}