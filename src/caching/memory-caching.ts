import { ConfigCaching } from '../config';

import { CachingData } from './caching-data';
import { CachingStrategy } from './caching-strategy';

export class MemoryCaching implements CachingStrategy {
  private readonly _cache = new Map<string, CachingData>();

  async get(key: string, { ttl }: ConfigCaching): Promise<unknown | undefined> {
    const cached = this._cache.get(key);
    if (!cached) {
      return;
    }
    const { expiry, value } = cached;
    if (!ttl || !expiry) {
      return value;
    }
    const now = new Date().getTime();
    if (now > expiry) {
      await this.invalidate(key);
      return;
    }
    return value;
  }

  async set(
    key: string,
    value: unknown,
    { ttl }: ConfigCaching
  ): Promise<void> {
    this._cache.set(key, {
      expiry: ttl ? new Date().getTime() + ttl : null,
      value,
    });
  }

  async invalidate(key: string): Promise<void> {
    this._cache.delete(key);
  }

  async invalidateAll(): Promise<void> {
    this._cache.clear();
  }
}
