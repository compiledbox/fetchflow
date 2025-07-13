import { FetchError } from '../errors/FetchError';
import { RequestOptions } from './types';

const DEFAULT_TIMEOUT = 15000;

export async function httpClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT,
    credentials = 'same-origin',
    customFetch,
  } = options;

  const finalHeaders = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  });

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
    credentials,
    ...(controller ? { signal: controller.signal } : {}),
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const fetchToUse = customFetch || (typeof fetch !== 'undefined' ? fetch : undefined);

  if (!fetchToUse) {
    throw FetchError.unknownError(
      new Error('No fetch implementation found. For SSR, provide custom fetch in options.'),
    );
  }

  try {
    const response = await fetchToUse(url, fetchOptions);
    if (timeout) clearTimeout(timeout);

    if (!response.ok) {
      const responseText = await response.text();
      let message = `HTTP error: ${response.status}`;
      try {
        const parsed = JSON.parse(responseText);
        message = parsed.message || message;
      } catch {
        message = responseText || message;
      }
      throw FetchError.httpError(response.status, message);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    throw FetchError.unknownError(new Error('Unexpected content-type received'));
  } catch (error) {
    if (timeout) clearTimeout(timeout);

    if (error instanceof FetchError) {
      throw error;
    }

    if (
      typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw FetchError.timeoutError(timeoutMs);
    }

    throw FetchError.networkError(error instanceof Error ? error : undefined);
  }
}
