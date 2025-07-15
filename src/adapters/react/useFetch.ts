import { useCallback, useEffect, useRef, useState } from 'react';
import { FetchError } from '../../core/errors/FetchError';
import { useFetchCore } from '../../core/hooks/useFetchCore';
import { UseFetchOptions, UseFetchReturn } from './types';

/**
 * React hook for performing secure, cached, and retry-enabled fetches.
 */
export function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchReturn<T> {
  const {
    enabled = true,
    cacheTimeMs,
    retryCount,
    retryDelayMs,
    cacheEnabled,
    ...requestOptions
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<FetchError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [fromCache, setFromCache] = useState<boolean>(false);

  const latestRequest = useRef(0);

  const fetchData = useCallback(async () => {
    const currentRequest = ++latestRequest.current; // Ensure latest request handling
    setIsLoading(true);
    setError(null);

    try {
      const result = await useFetchCore<T>(url, {
        cacheTimeMs,
        retryCount,
        retryDelayMs,
        cacheEnabled,
        ...requestOptions,
      });

      // Ensure the response is from the latest request to avoid stale updates
      if (currentRequest === latestRequest.current) {
        setData(result.data);
        setFromCache(result.fromCache);
        setIsLoading(false);
      }
    } catch (err) {
      if (currentRequest === latestRequest.current) {
        setError(err instanceof FetchError ? err : FetchError.unknownError(err as Error));
        setIsLoading(false);
      }
    }
  }, [url, cacheTimeMs, retryCount, retryDelayMs, cacheEnabled, JSON.stringify(requestOptions)]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    // Cleanup function resets loading state if component unmounts mid-fetch
    return () => {
      latestRequest.current++;
      setIsLoading(false);
    };
  }, [fetchData, enabled]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    fromCache,
  };
}
