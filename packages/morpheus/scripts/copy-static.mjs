import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const packageRoot = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '..'
);

const imageSource = resolve(packageRoot, 'client/image');
const imageTarget = resolve(packageRoot, 'dist/image');

if (existsSync(imageSource)) {
  mkdirSync(imageTarget, { recursive: true });
  cpSync(imageSource, imageTarget, { recursive: true });
}

