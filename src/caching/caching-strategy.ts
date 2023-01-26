import {
  type ConfigCaching,
  type ConfigCachingType,
} from '../config/config-caching.js';

export abstract class CachingStrategy {
  abstract get(key: string, options: ConfigCaching): Promise<unknown>;
  abstract set(
    key: string,
    value: unknown,
    options: ConfigCaching
  ): Promise<void>;
  abstract invalidate(key: string, options: ConfigCaching): Promise<void>;
  abstract invalidateAll(options: ConfigCaching): Promise<void>;
  abstract type(): ConfigCachingType;
}
