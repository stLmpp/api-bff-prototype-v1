import { type ConfigCachingType } from '../config/config-caching.js';

import { type CachingStrategy } from './caching-strategy.js';
import { MemoryCaching } from './memory-caching.js';
import { PersistentCaching } from './persistent-caching.js';

const cachingInstances = Object.freeze({
  memory: new MemoryCaching(),
  persistent: new PersistentCaching(),
}) satisfies Record<ConfigCachingType, CachingStrategy>;

export function getCachingStrategy(key: ConfigCachingType): CachingStrategy {
  return cachingInstances[key];
}

export function getAllCachingStrategies(): CachingStrategy[] {
  return Object.values(cachingInstances);
}
