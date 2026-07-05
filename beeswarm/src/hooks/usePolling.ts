import { useEffect, useRef, useState, useCallback } from "react";

interface UsePollingOptions {
  callback: () => Promise<void>;
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePolling({
  callback,
  interval = 30000,
  enabled = true,
  onError,
}: UsePollingOptions) {
  // Use refs to store latest values so callbacks stay stable
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);
  const onErrorRef = useRef(onError);
  const intervalDurationRef = useRef(interval);
  
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Update refs when props change (no re-renders needed)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    intervalDurationRef.current = interval;
  }, [interval]);

  const executePoll = useCallback(async () => {
    try {
      setError(null);
      await callbackRef.current();
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    }
  }, []); // No dependencies! Stable identity forever

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    setIsPolling(true);
    void executePoll();
    intervalRef.current = setInterval(
      () => void executePoll(), 
      intervalDurationRef.current
    );
  }, [executePoll]); // executePoll is stable now

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []); // Also stable forever

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return {
    isPolling,
    lastUpdated,
    error,
    startPolling,
    stopPolling,
    executePoll,
  };
}
