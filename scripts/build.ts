import { build } from 'esbuild';
import fastGlob from 'fast-glob';
import { rimraf } from 'rimraf';

async function main(): Promise<void> {
  await rimraf('dist');
  const files = await fastGlob(['src/**/*.{ts,mts}', 'app/**/*.{ts,mts}']);
  await build({
    entryPoints: files,
    platform: 'node',
    outdir: 'dist',
    format: 'esm',
    minify: true,
    define: {
      PROD: 'true',
    },
  });
}

main();
