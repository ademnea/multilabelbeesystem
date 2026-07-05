/**
 * Reads and subscribes to the temperature unit preference (°C / °F).
 * Exposes a formatTemp() helper so any component can display temperatures
 * in the user's chosen unit without knowing the raw value unit.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PREF_TEMP_UNIT = "@bsads/temperature_unit";

type Unit = "C" | "F";
type Listener = (unit: Unit) => void;

const listeners = new Set<Listener>();
let _current: Unit = "C";

export function notifyTempUnitChange(unit: Unit) {
  _current = unit;
  listeners.forEach((l) => l(unit));
}

/** Convert Celsius to the stored unit */
export function convertTemp(celsius: number, unit: Unit): number {
  return unit === "F" ? celsius * 9 / 5 + 32 : celsius;
}

export function useTemperatureUnit() {
  const [unit, setUnit] = useState<Unit>(_current);

  useEffect(() => {
    // Load persisted value on mount
    AsyncStorage.getItem(PREF_TEMP_UNIT)
      .then((v) => {
        if (v === "C" || v === "F") {
          _current = v;
          setUnit(v);
        }
      })
      .catch(() => {});

    const listener: Listener = (u) => setUnit(u);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  /** Format a Celsius value to the user's chosen unit with symbol */
  const formatTemp = useCallback(
    (celsius: number, decimals = 1) => {
      const val = convertTemp(celsius, unit);
      return `${val.toFixed(decimals)}°${unit}`;
    },
    [unit],
  );

  return { unit, formatTemp, convertTemp: (c: number) => convertTemp(c, unit) };
}
