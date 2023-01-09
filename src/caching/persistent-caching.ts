import { mkdir } from 'node:fs/promises';

import { pathExists } from '../path-exists';

import { CachingStrategy } from './caching-strategy';
import { ConfigCaching } from '../config';
import { rmdir } from 'fs/promises';
import { join } from 'node:path';

export class PersistentCaching implements CachingStrategy {
  private async _createFolder(path: string): Promise<void> {
    const exists = await pathExists(path);
    if (exists) {
      return;
    }
    await mkdir(path);
  }

  get(key: string, { path, ttl }: ConfigCaching): Promise<unknown> {
    return Promise.resolve(undefined);
  }

  set(
    key: string,
    value: unknown,
    { path, ttl }: ConfigCaching
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  async invalidate(key: string, { path }: ConfigCaching): Promise<void> {
    await rmdir(join());
  }

  invalidateAll({ path }: ConfigCaching): Promise<void> {
    return Promise.resolve(undefined);
  }
}
