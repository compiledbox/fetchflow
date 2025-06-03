import { httpClient } from '../network/httpClient';
import { InMemoryCache } from '../cache/inMemoryCache';
import { FetchError } from '../errors/FetchError';
import { retryWithBackoff } from '../errors/retryPolicy';
import { RequestOptions } from '../network/types';

interface FetchCoreOptions extends RequestOptions {
  cacheTimeMs?: number; // How long to cache the response
  retryCount?: number; // Number of retry attempts on failure
  retryDelayMs?: number; // Base delay between retries (exponential backoff)
  cacheEnabled?: boolean; // Enable or disable caching
}

interface FetchResult<T> {
  data: T;
  fromCache: boolean;
}

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 1000; // 1 second base delay

// Instantiate a global cache for all fetches (could also inject via DI)
const cache = new InMemoryCache<unknown>(1000);

/**
 * Core fetching logic (caching, retry, error handling).
 */
export async function useFetchCore<T>(
  url: string,
  options: FetchCoreOptions = {},
): Promise<FetchResult<T>> {
  const {
    cacheTimeMs = 300_000, // default 5 minutes
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    cacheEnabled = true,
    ...requestOptions
  } = options;

  const cacheKey = JSON.stringify({ url, requestOptions });

  // Attempt to return cached data
  if (cacheEnabled) {
    const cachedData = cache.get(cacheKey);
    if (cachedData !== undefined) {
      return {
        data: cachedData as T,
        fromCache: true,
      };
    }
  }

  // Function to perform fetch operation
  const fetchData = async (): Promise<T> => {
    const data = await httpClient<T>(url, requestOptions);
    return data;
  };

  // Attempt fetch with retry logic
  try {
    const data = await retryWithBackoff<T>(fetchData, retryCount, retryDelayMs);

    // Cache fetched data
    if (cacheEnabled) {
      cache.set(cacheKey, data, cacheTimeMs);
    }

    return {
      data,
      fromCache: false,
    };
  } catch (error) {
    if (error instanceof FetchError) {
      throw error; // rethrow existing standardized errors
    }
    throw FetchError.unknownError(error instanceof Error ? error : undefined);
  }
}
