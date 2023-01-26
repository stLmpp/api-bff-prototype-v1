import { type ApiConfig } from '../api-config/api-config.js';
import {
  CONFIG_CACHING_PATH_DEFAULT,
  type ConfigCaching,
  defaultKeyComposer,
} from '../config/config-caching.js';
import { getConfig } from '../config/config.js';

import { getCachingStrategy } from './caching-resolver.js';

export async function getApiCachingConfig(apiConfig: ApiConfig) {
  const config = await getConfig();
  const defaultConfig = {
    path: CONFIG_CACHING_PATH_DEFAULT,
    keyComposer: defaultKeyComposer,
    strategy: getCachingStrategy('memory'),
  } satisfies ConfigCaching;
  const hasCachingConfig =
    apiConfig.caching !== false && (!!config.caching || !!apiConfig.caching);
  return {
    caching: hasCachingConfig
      ? ({
          ...defaultConfig,
          ...config.caching,
          ...apiConfig.caching,
        } satisfies ConfigCaching)
      : defaultConfig,
    hasCachingConfig,
  };
}
