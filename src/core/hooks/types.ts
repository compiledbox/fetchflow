import { FetchError } from '../errors/FetchError';
import { RequestOptions } from '../network/types';

export interface FetchCoreOptions extends RequestOptions {
  cacheTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  cacheEnabled?: boolean;
}

export interface FetchResult<T> {
  data: T;
  fromCache: boolean;
}

export interface PollCoreOptions extends FetchCoreOptions {
  intervalMs: number;
  enabled?: boolean;
}

export interface PollCoreReturn<T> {
  start: () => void;
  stop: () => void;
  isPolling: () => boolean;
  onData: (callback: (data: T, fromCache: boolean) => void) => void;
  onError: (callback: (error: FetchError) => void) => void;
}
