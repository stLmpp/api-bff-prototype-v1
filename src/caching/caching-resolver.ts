import { ConfigCachingType } from '../config';

import { CachingStrategy } from './caching-strategy';
import { MemoryCaching } from './memory-caching';

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
        // TODO implement
        throw new Error('Not implemented');
      },
    } satisfies Record<ConfigCachingType, () => CachingStrategy>;
    return map[key]();
  }
}
