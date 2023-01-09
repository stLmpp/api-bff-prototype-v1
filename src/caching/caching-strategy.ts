import { ConfigCaching } from '../config.js';

export interface CachingStrategy {
  get(key: string, options: ConfigCaching): Promise<unknown>;
  set(key: string, value: unknown, options: ConfigCaching): Promise<void>;
  invalidate(key: string, options: ConfigCaching): Promise<void>;
  invalidateAll(options: ConfigCaching): Promise<void>;
}
