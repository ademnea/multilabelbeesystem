/**
 * Reads and subscribes to the satellite map preference from AsyncStorage.
 * Returns { satellite: boolean } and re-renders components that use it
 * whenever the value changes.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PREF_SATELLITE_MAP = "@bsads/satellite_map";

// Simple pub/sub so all consumers stay in sync without React Context
type Listener = (value: boolean) => void;
const listeners = new Set<Listener>();
let _current = false;

export function notifySatelliteChange(value: boolean) {
  _current = value;
  listeners.forEach((l) => l(value));
}

export function useMapStyle() {
  const [satellite, setSatellite] = useState(_current);

  useEffect(() => {
    // Load persisted value on mount
    AsyncStorage.getItem(PREF_SATELLITE_MAP)
      .then((v) => {
        if (v !== null) {
          const val = v === "true";
          _current = val;
          setSatellite(val);
        }
      })
      .catch(() => {});

    // Subscribe to live changes
    const listener: Listener = (v) => setSatellite(v);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return { satellite };
}
