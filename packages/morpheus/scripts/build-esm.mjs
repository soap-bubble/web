import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';

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

const priorityByExtension = new Map([
  ['.ts', 2],
  ['.tsx', 2],
  ['.js', 1],
  ['.jsx', 1]
]);

const normalizedEntries = new Map();

for (const entry of entryPoints) {
  const extension = extname(entry);
  const key = entry
    .replace(/^client\/js\//, '')
    .replace(/\.(ts|tsx|js|jsx)$/, '');
  const current = normalizedEntries.get(key);
  if (!current) {
    normalizedEntries.set(key, entry);
    continue;
  }
  const currentPriority = priorityByExtension.get(extname(current)) ?? 0;
  const nextPriority = priorityByExtension.get(extension) ?? 0;
  if (nextPriority >= currentPriority) {
    normalizedEntries.set(key, entry);
  }
}

const options = {
  entryPoints: Array.from(normalizedEntries.values()).map(entry =>
    resolve(packageRoot, entry)
  ),
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
    '.js': 'tsx',
    '.jsx': 'tsx'
  }
};

if (process.argv.includes('--watch')) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Watching Morpheus sources for changes...');
} else {
  await build(options);
}

