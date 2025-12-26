import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const packageRoot = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '..'
);

rmSync(resolve(packageRoot, 'dist'), { recursive: true, force: true });

