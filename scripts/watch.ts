import { type ChildProcess, spawn } from 'child_process';

import { context, type Plugin } from 'esbuild';
import { rimraf } from 'rimraf';

import { getDefaultOptions } from './get-default-options.js';
import { typecheckingPlugin } from './typechecking-plugin.js';

const devPlugin = {
  name: 'dev',
  setup: (build) => {
    let nodeProgram: ChildProcess | null = null;
    const clearProgram = () => {
      if (nodeProgram) {
        nodeProgram.kill();
        nodeProgram = null;
      }
    };
    build.onEnd((buildResult) => {
      clearProgram();
      if (buildResult.errors.length) {
        return;
      }
      console.log('Build finished, starting program');
      nodeProgram = spawn('node', ['dist/main.js'], {
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
  defaultOptions.plugins.push(devPlugin, typecheckingPlugin());
  const result = await context({
    ...defaultOptions,
    sourcemap: true,
    minify: false,
  });
  await result.watch();
}

main();
