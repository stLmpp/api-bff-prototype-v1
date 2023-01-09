import { ConfigCachingType } from '../config';

import { CachingStrategy } from './caching-strategy';
import { MemoryCaching } from './memory-caching';
import { PersistentCaching } from './persistent-caching';

export class CachingResolver {
  private static readonly _cachedCaching = new Map<
    ConfigCachingType,
    CachingStrategy
  >();

  static getCachingStrategy(key: ConfigCachingType): CachingStrategy {
    const map = {
      memory: () => {
        let strategy = this._cachedCaching.get(key);
        if (!strategy) {
          strategy = new MemoryCaching();
          this._cachedCaching.set(key, strategy);
        }
        return strategy;
      },
      persistent: () => {
        let strategy = this._cachedCaching.get(key);
        if (!strategy) {
          strategy = new PersistentCaching();
          this._cachedCaching.set(key, strategy);
        }
        return strategy;
      },
    } satisfies Record<ConfigCachingType, () => CachingStrategy>;
    return map[key]();
  }
}
