import { useEffect, useRef, useState } from "react";
import { ClassificationAlert } from "../utils/sampleClassificationData";
import {
  getPrediction,
  getHivePredictions,
  getPredictionForClassification,
} from "../api/predictionApi";
import { showClassificationAlert } from "../utils/alertNotification";

interface UsePredictionFetcherOptions {
  hiveIds: string[];
  enabled?: boolean;
  interval?: number;
  showAlerts?: boolean;
}

interface PredictionState {
  predictions: ClassificationAlert[];
  loading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
}

export function usePredictionFetcher(options: UsePredictionFetcherOptions) {
  const { hiveIds, enabled = true, interval = 30000, showAlerts = true } = options;

  const [state, setState] = useState<PredictionState>({
    predictions: [],
    loading: false,
    error: null,
    lastFetchTime: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPredictions = async () => {
    if (hiveIds.length === 0) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const predictions = await getHivePredictions(hiveIds);
      setState({ predictions, loading: false, error: null, lastFetchTime: new Date() });
      if (showAlerts) predictions.forEach((p) => showClassificationAlert(p));
      return predictions;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const startFetching = () => {
    if (intervalRef.current) return;
    void fetchPredictions();
    intervalRef.current = setInterval(() => void fetchPredictions(), interval);
  };

  const stopFetching = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchSinglePrediction = async (hiveId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const prediction = await getPrediction(hiveId);
      setState((prev) => ({
        ...prev,
        predictions: [prediction, ...prev.predictions],
        loading: false,
        lastFetchTime: new Date(),
      }));
      if (showAlerts) showClassificationAlert(prediction);
      return prediction;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const fetchSinglePredictionForClassification = async (
    hiveId: string,
    classification: string
  ) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const prediction = await getPredictionForClassification(hiveId, classification);
      setState((prev) => ({
        ...prev,
        predictions: [prediction, ...prev.predictions],
        loading: false,
        lastFetchTime: new Date(),
      }));
      if (showAlerts) showClassificationAlert(prediction);
      return prediction;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  useEffect(() => {
    if (enabled) {
      startFetching();
    } else {
      stopFetching();
    }
    return stopFetching;
  }, [enabled, interval, hiveIds.length]);

  return {
    ...state,
    fetchPredictions,
    fetchSinglePrediction,
    fetchSinglePredictionForClassification,
    startFetching,
    stopFetching,
  };
}
