import { type ChildProcess, spawn } from 'child_process';

import { context, type Plugin } from 'esbuild';
import { rimraf } from 'rimraf';

import { getDefaultOptions } from './get-default-options.js';

const devPlugin = {
  name: 'dev',
  setup: (build) => {
    let program: ChildProcess | null = null;
    const clearProgram = () => {
      if (program) {
        program.kill();
        program = null;
      }
    };
    build.onEnd((buildResult) => {
      clearProgram();
      if (buildResult.errors.length) {
        return;
      }
      console.log('Build finished, starting program');
      program = spawn('node', ['dist/main.js'], {
        env: process.env,
        stdio: 'inherit',
      });
    });
    build.onDispose(() => {
      clearProgram();
    });
    let count = 0;
    build.onStart(() => {
      console.log(count ? 'Rebuilding...' : 'Building...');
      count++;
    });
  },
} satisfies Plugin;

async function main(): Promise<void> {
  const [defaultOptions] = await Promise.all([
    getDefaultOptions(),
    rimraf('dist'),
  ]);
  defaultOptions.define.PROD = 'false';
  defaultOptions.plugins.push(devPlugin);
  const result = await context({
    ...defaultOptions,
    sourcemap: true,
    minify: false,
  });
  await result.watch();
}

main();
