import { ConfigCachingType } from '../config.js';

import { CachingStrategy } from './caching-strategy.js';
import { MemoryCaching } from './memory-caching.js';
import { PersistentCaching } from './persistent-caching.js';

export class CachingResolver {
  private static readonly _instances = {
    memory: new MemoryCaching(),
    persistent: new PersistentCaching(),
  } satisfies Record<ConfigCachingType, CachingStrategy>;

  static getCachingStrategy(key: ConfigCachingType): CachingStrategy {
    return this._instances[key];
  }

  static getAllCachingStrategies(): CachingStrategy[] {
    return Object.values(this._instances);
  }
}
