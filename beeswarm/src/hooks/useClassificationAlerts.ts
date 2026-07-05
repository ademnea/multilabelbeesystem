import { useEffect, useRef, useState } from "react";
import {
  ClassificationAlert,
  generateSampleClassification,
} from "../utils/sampleClassificationData";
import { showClassificationAlert } from "../utils/alertNotification";

interface UseClassificationAlertsOptions {
  hiveIds: string[];
  enabled?: boolean;
  interval?: number;
  simulateOnStart?: boolean;
}

export function useClassificationAlerts(options: UseClassificationAlertsOptions) {
  const {
    hiveIds,
    enabled = true,
    interval = 30000,
    simulateOnStart = false,
  } = options;

  const [alerts, setAlerts] = useState<ClassificationAlert[]>([]);
  const [isSimulating, setIsSimulating] = useState(enabled && simulateOnStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRandomAlert = (specificHiveId?: string) => {
    if (hiveIds.length === 0) return;
    const hiveId =
      specificHiveId ?? hiveIds[Math.floor(Math.random() * hiveIds.length)];
    const alert = generateSampleClassification(hiveId);
    setAlerts((prev) => [alert, ...prev]);
    showClassificationAlert(alert);
    return alert;
  };

  const startSimulation = () => {
    setIsSimulating(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerRandomAlert();
    intervalRef.current = setInterval(() => triggerRandomAlert(), interval);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (enabled && isSimulating && !intervalRef.current) {
      startSimulation();
    } else if (!enabled && intervalRef.current) {
      stopSimulation();
    }
  }, [enabled]);

  return {
    alerts,
    isSimulating,
    triggerRandomAlert,
    startSimulation,
    stopSimulation,
    clearAlerts: () => setAlerts([]),
  };
}
