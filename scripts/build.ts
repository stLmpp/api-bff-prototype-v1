import { build } from 'esbuild';
import fastGlob from 'fast-glob';
import rimraf from 'rimraf';

async function rimrafAsync(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(path, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function main(): Promise<void> {
  await rimrafAsync('dist');
  const files = await fastGlob(['src/**/*.{ts,mts}', 'app/**/*.{ts,mts}']);
  await build({
    entryPoints: files,
    platform: 'node',
    outdir: 'dist',
    format: 'esm',
  });
}

main();
