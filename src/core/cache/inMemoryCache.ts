export interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in milliseconds
}

export class InMemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieves an entry from the cache by key.
   * If entry is expired, it returns undefined and removes the entry.
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      // Entry expired, remove from cache
      this.cache.delete(key);
      return undefined;
    }

    // Refresh entry position for LRU policy
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Stores a value in the cache with an optional TTL (default 5 minutes).
   * Automatically evicts least recently used entry if maxEntries is exceeded.
   * @param key - Cache key
   * @param value - Value to store
   * @param ttlMs - Time-to-live in milliseconds
   */
  public set(key: string, value: T, ttlMs: number = 300_000): void {
    const expiresAt = Date.now() + ttlMs;

    if (this.cache.size >= this.maxEntries) {
      // Remove the least recently used (LRU) entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Removes an entry from the cache by key.
   * @param key - Cache key to delete
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current number of cached entries.
   */
  public size(): number {
    return this.cache.size;
  }
}
