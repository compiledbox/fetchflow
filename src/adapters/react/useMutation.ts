// src/adapters/react/useMutation.tsx

import { useState, useCallback } from 'react';
import { httpClient } from '../../core/network/httpClient';
import { FetchError } from '../../core/errors/FetchError';
import { RequestOptions } from '../../core/network/types';
import { UseMutationOptions, UseMutationReturn } from './types';

/**
 * React hook for performing mutations (POST, PUT, PATCH, DELETE).
 */
export function useMutation<TResponse, TVariables = object>(
  options: UseMutationOptions<TResponse, TVariables>,
): UseMutationReturn<TResponse, TVariables> {
  const {
    url,
    method = 'POST',
    headers = {},
    timeoutMs,
    credentials = 'same-origin',
    onSuccess,
    onError,
  } = options;

  const [isMutating, setIsMutating] = useState(false);
  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState<FetchError | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsMutating(true);
      setError(null);

      const requestOptions: RequestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeoutMs,
        credentials,
        body: variables as object,
      };

      try {
        const response = await httpClient<TResponse>(url, requestOptions);
        setData(response);
        onSuccess?.(response);
      } catch (err) {
        const fetchError =
          err instanceof FetchError
            ? err
            : FetchError.unknownError(err instanceof Error ? err : undefined);
        setError(fetchError);
        onError?.(fetchError);
      } finally {
        setIsMutating(false);
      }
    },
    [url, method, JSON.stringify(headers), timeoutMs, credentials, onSuccess, onError],
  );

  return {
    mutate,
    isMutating,
    data,
    error,
  };
}
