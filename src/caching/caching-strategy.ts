import { ConfigCaching } from '../config';

export interface CachingStrategy {
  get(key: string, options: ConfigCaching): Promise<unknown>;
  set(key: string, value: unknown, options: ConfigCaching): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidateAll(): Promise<void>;
}
