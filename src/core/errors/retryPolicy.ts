/**
 * Utility function to wait asynchronously.
 * @param ms Milliseconds to wait
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an asynchronous function with exponential backoff upon failure.
 *
 * @param fn - The async function to retry.
 * @param retries - Number of retry attempts.
 * @param baseDelayMs - Initial delay in milliseconds before retrying.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  baseDelayMs: number = 1000,
): Promise<T> {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      // Exponential backoff: baseDelayMs * 2^(attempt) + random jitter
      const jitter = Math.floor(Math.random() * 100);
      const backoffDelay = baseDelayMs * Math.pow(2, attempt) + jitter;

      await delay(backoffDelay);
      attempt += 1;
    }
  }

  // This point should not be reachable, but added for type completeness
  throw new Error('retryWithBackoff reached unreachable code.');
}
