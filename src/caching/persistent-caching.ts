import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  type ConfigCaching,
  type ConfigCachingType,
} from '../config/config-caching.js';
import { pathExists } from '../path-exists.js';

import { type CachingData, CachingDataSchema } from './caching-data.js';
import { CachingStrategy } from './caching-strategy.js';

export class PersistentCaching extends CachingStrategy {
  private async _createFolder(path: string): Promise<void> {
    const exists = await pathExists(path);
    if (exists) {
      return;
    }
    await mkdir(path);
  }

  private readonly _characterReplacements: ReadonlyMap<string, string> =
    new Map<string, string>()
      .set('/', '__')
      .set('\\', '___')
      .set('<', '_-_')
      .set('>', '-_-')
      .set(':', '--')
      .set('"', '-_')
      .set('|', '_-')
      .set('?', '--_')
      .set('*', '__-');

  private readonly _reservedNames: ReadonlySet<string> = new Set([
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]);

  private _sanitizeKey(key: string): string {
    for (const [character, replacement] of this._characterReplacements) {
      key = key.replaceAll(character, replacement);
    }
    key = key.replace(/[.\s]$/, '____');
    if (this._reservedNames.has(key)) {
      throw new Error(
        `Key cannot be reserved names: ${[...this._reservedNames].join(', ')}`
      );
    }
    return key;
  }

  private _getFilePath(path: string, key: string): string {
    return `${join(path, this._sanitizeKey(key))}.json`;
  }

  async get(key: string, options: ConfigCaching): Promise<unknown> {
    const { path, ttl } = options;
    const filePath = this._getFilePath(path, key);
    const exists = await pathExists(filePath);
    if (!exists) {
      return;
    }
    const file = await readFile(filePath, { encoding: 'utf8' });
    let cached: CachingData;
    try {
      cached = JSON.parse(file);
      await CachingDataSchema.parseAsync(cached);
    } catch {
      await this.invalidate(key, options);
      return;
    }
    const { expiry, value } = cached;
    if (!ttl || !expiry) {
      return value;
    }
    const now = new Date().getTime();
    if (now > expiry) {
      await this.invalidate(key, options);
      return;
    }
    return value;
  }

  async set(
    key: string,
    value: unknown,
    { path, ttl }: ConfigCaching
  ): Promise<void> {
    const cache: CachingData = {
      value,
      expiry: ttl ? new Date().getTime() + ttl : null,
    };
    await this._createFolder(path);
    await writeFile(this._getFilePath(path, key), JSON.stringify(cache));
  }

  async invalidate(key: string, { path }: ConfigCaching): Promise<void> {
    await rm(this._getFilePath(path, key));
  }

  async invalidateAll({ path }: ConfigCaching): Promise<void> {
    await rm(path, { recursive: true, force: true });
  }

  type(): ConfigCachingType {
    return 'persistent';
  }
}
