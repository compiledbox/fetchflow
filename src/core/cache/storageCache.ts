import type { CacheEntry, CacheProvider } from './types';

const NAMESPACE = 'fetchflow-cache';

function getNamespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

export class StorageCache<T> implements CacheProvider<T> {
  private storage: Storage;

  constructor(storage?: Storage) {
    this.storage = storage || window.localStorage;
  }

  get(key: string): T | undefined {
    try {
      const item = this.storage.getItem(getNamespacedKey(key));
      if (!item) return undefined;

      const entry: CacheEntry<T> = JSON.parse(item);
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        return undefined;
      }
      return entry.value;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: T, ttlMs: number = 300_000): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    try {
      this.storage.setItem(getNamespacedKey(key), JSON.stringify(entry));
    } catch {
      // Ignore quota errors or serialization issues
    }
  }

  delete(key: string): void {
    try {
      this.storage.removeItem(getNamespacedKey(key));
    } catch {
      // Ignore
    }
  }

  clear(): void {
    try {
      // Only remove entries for this namespace
      for (let i = this.storage.length - 1; i >= 0; i--) {
        const key = this.storage.key(i);
        if (key && key.startsWith(NAMESPACE + ':')) {
          this.storage.removeItem(key);
        }
      }
    } catch {
      // Ignore
    }
  }

  size(): number {
    try {
      let count = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(NAMESPACE + ':')) {
          count++;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }
}
