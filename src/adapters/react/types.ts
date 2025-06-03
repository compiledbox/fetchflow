
import { FetchError } from '../../core/errors/FetchError';
import { RequestOptions } from '../../core/network/types';

// --- useFetch ---
export interface UseFetchOptions extends RequestOptions {
  cacheTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  enabled?: boolean;
  cacheEnabled?: boolean;
}
export interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: FetchError | null;
  refetch: () => Promise<void>;
  fromCache: boolean;
}

// --- usePoll ---
export interface UsePollOptions extends RequestOptions {
  intervalMs: number;
  cacheTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  cacheEnabled?: boolean;
  enabled?: boolean;
}
export interface UsePollReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: FetchError | null;
  stopPolling: () => void;
  startPolling: () => void;
  fromCache: boolean;
}

// --- useMutation ---
export interface UseMutationOptions<TResponse, TVariables> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: FetchError) => void;
}
export interface UseMutationReturn<TResponse, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  isMutating: boolean;
  data: TResponse | null;
  error: FetchError | null;
}
