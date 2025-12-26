import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import fg from 'fast-glob';
import { build, context } from 'esbuild';

const packageRoot = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '..'
);

const entryPoints = await fg(['client/js/**/*.{ts,tsx,js,jsx}'], {
  cwd: packageRoot,
  ignore: [
    '**/__tests__/**',
    '**/__mocks__/**',
    '**/*.spec.*',
    '**/*.test.*'
  ]
});

const options = {
  entryPoints: entryPoints.map(entry => resolve(packageRoot, entry)),
  outdir: resolve(packageRoot, 'dist'),
  outbase: resolve(packageRoot, 'client/js'),
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  bundle: false,
  splitting: false,
  treeShaking: false,
  jsx: 'automatic',
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.js': 'jsx',
    '.jsx': 'jsx'
  }
};

if (process.argv.includes('--watch')) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Watching Morpheus sources for changes...');
} else {
  await build(options);
}

