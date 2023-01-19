import { build } from 'esbuild';
import { rimraf } from 'rimraf';

import { getDefaultOptions } from './get-default-options.js';

async function main(): Promise<void> {
  const [defaultOptions] = await Promise.all([
    getDefaultOptions(),
    rimraf('dist'),
  ]);
  await build({
    ...defaultOptions,
  });
}

main();
