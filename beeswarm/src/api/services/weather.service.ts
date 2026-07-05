/**
 * Weather service
 * Handles ambient weather data from Open-Meteo API
 */

import { AmbientWeather } from "../types";
import { cacheData, getCachedData } from "../utils/offlineCache";

export async function fetchAmbientWeather(
  latitude = 0.3476,
  longitude = 32.5825,
): Promise<AmbientWeather> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m",
      timezone: "auto",
    });

    const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!resp.ok) throw new Error(`Weather API failed (${resp.status})`);

    const data = await resp.json();
    const cur = data?.current;
    const tempC = Number(cur?.temperature_2m);
    const hum = Number(cur?.relative_humidity_2m);

    if (!Number.isFinite(tempC) || !Number.isFinite(hum)) {
      throw new Error("Weather API returned unexpected values");
    }

    const result: AmbientWeather = {
      temperatureC: tempC,
      humidityPercent: hum,
      observedAt: String(cur?.time ?? new Date().toISOString()),
      source: "open-meteo",
    };
    
    // Cache the weather data
    await cacheData("ambientWeather", result);
    
    return result;
  } catch (error) {
    // If fetch fails, try to get cached weather data
    const cached = await getCachedData<AmbientWeather>("ambientWeather");
    if (cached) {
      return cached;
    }
    throw error;
  }
}