import { type BuildOptions } from 'esbuild';
import fastGlob from 'fast-glob';

export async function getDefaultOptions() {
  const files = await fastGlob(['src/**/*.{ts,mts}']);
  return {
    entryPoints: files,
    platform: 'node',
    outdir: 'dist',
    format: 'esm',
    minify: true,
    define: {
      PROD: 'true',
    },
  } satisfies BuildOptions;
}
