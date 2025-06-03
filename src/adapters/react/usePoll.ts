import { useEffect, useRef } from 'react';
import { UsePollOptions, UsePollReturn } from './types';
import { useFetch } from './useFetch';

/**
 * React hook to automatically poll data at specified intervals.
 */
export function usePoll<T>(url: string, options: UsePollOptions): UsePollReturn<T> {
  const {
    intervalMs,
    enabled = true,
    cacheTimeMs,
    retryCount,
    retryDelayMs,
    cacheEnabled,
    ...requestOptions
  } = options;

  const { data, isLoading, error, refetch, fromCache } = useFetch<T>(url, {
    cacheTimeMs,
    retryCount,
    retryDelayMs,
    cacheEnabled,
    enabled,
    ...requestOptions,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        refetch().catch(() => {
          /* error handled via hook state */
        });
      }, intervalMs);
    }
  };

  const stopPolling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled) {
      startPolling();
    }

    // Cleanup on component unmount or when polling is disabled
    return () => stopPolling();
  }, [intervalMs, enabled, url, JSON.stringify(requestOptions)]);

  return {
    data,
    isLoading,
    error,
    stopPolling,
    startPolling,
    fromCache,
  };
}
