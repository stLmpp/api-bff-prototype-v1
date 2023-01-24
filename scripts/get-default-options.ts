import { type BuildOptions } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import fastGlob from 'fast-glob';

export async function getDefaultOptions() {
  const files = await fastGlob(['src/routes/**/*.{ts,mts}']);
  return {
    entryPoints: ['src/main.ts', ...files],
    platform: 'node',
    outdir: 'dist',
    format: 'esm',
    minify: true,
    bundle: true,
    define: {
      PROD: 'true',
    },
    plugins: [nodeExternalsPlugin()],
  } satisfies BuildOptions;
}
