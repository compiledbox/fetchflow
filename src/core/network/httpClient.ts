import { FetchError } from '../errors/FetchError';
import { RequestOptions } from './types';

const DEFAULT_TIMEOUT = 15000; // 15 seconds timeout

/**
 * Secure, robust HTTP client wrapping native fetch.
 */
export async function httpClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT,
    credentials = 'same-origin',
  } = options;

  // Ensure headers always include necessary security headers
  const finalHeaders = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
    credentials,
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);

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
    clearTimeout(timeout);

    if (error instanceof FetchError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw FetchError.timeoutError(timeoutMs);
    }

    throw FetchError.networkError(error instanceof Error ? error : undefined);
  }
}
