import { useFetchCore } from './useFetchCore';
import type { PollCoreOptions, PollCoreReturn } from './types';
import { FetchError } from '../errors/FetchError';

export function usePollCore<T>(url: string, options: PollCoreOptions): PollCoreReturn<T> {
  const {
    intervalMs,
    enabled = true,
    cacheTimeMs,
    retryCount,
    retryDelayMs,
    cacheEnabled,
    ...requestOptions
  } = options;

  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let isPollingActive = false;

  const dataListeners: Array<(data: T, fromCache: boolean) => void> = [];
  const errorListeners: Array<(error: FetchError) => void> = [];

  const fetchAndEmit = async () => {
    try {
      const result = await useFetchCore<T>(url, {
        cacheTimeMs,
        retryCount,
        retryDelayMs,
        cacheEnabled,
        ...requestOptions,
      });
      dataListeners.forEach((listener) => listener(result.data, result.fromCache));
    } catch (error) {
      const fetchError =
        error instanceof FetchError
          ? error
          : FetchError.unknownError(error instanceof Error ? error : undefined);
      errorListeners.forEach((listener) => listener(fetchError));
    }
  };

  const start = () => {
    if (isPollingActive || !enabled) return;
    isPollingActive = true;

    fetchAndEmit().catch(() => {
      // Error already emitted to listeners.
    });

    pollingTimer = setInterval(fetchAndEmit, intervalMs);
  };

  const stop = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    isPollingActive = false;
  };

  const isPolling = () => isPollingActive;

  const onData = (callback: (data: T, fromCache: boolean) => void) => {
    dataListeners.push(callback);
  };

  const onError = (callback: (error: FetchError) => void) => {
    errorListeners.push(callback);
  };

  return {
    start,
    stop,
    isPolling,
    onData,
    onError,
  };
}
