import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const morpheusPath = fileURLToPath(
  new URL('../morpheus/client/js/morpheus', import.meta.url),
);
const morpheusClientPath = fileURLToPath(
  new URL('../morpheus/client/js/index.ts', import.meta.url),
);
const servicePath = fileURLToPath(
  new URL('../morpheus/client/js/service', import.meta.url),
);
const storePath = fileURLToPath(
  new URL('../morpheus/client/js/store', import.meta.url),
);
const utilsPath = fileURLToPath(
  new URL('../morpheus/client/js/utils', import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@soapbubble/morpheus-client/morpheus',
        replacement: morpheusPath,
      },
      {
        find: '@soapbubble/morpheus-client/service',
        replacement: servicePath,
      },
      { find: '@soapbubble/morpheus-client', replacement: morpheusClientPath },
      { find: /^@\//, replacement: `${srcPath}/` },
      { find: 'morpheus', replacement: morpheusPath },
      { find: 'service', replacement: servicePath },
      { find: 'store', replacement: storePath },
      { find: 'utils', replacement: utilsPath },
    ],
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'mcp-server/**/*.test.ts',
      'scripts/**/*.test.mjs',
    ],
    reporters: ['default'],
  },
});
