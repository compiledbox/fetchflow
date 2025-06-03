export interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface CacheProvider<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
}
