import { lstat, realpath, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_GAMEDB_SOURCE = path.resolve(
  packageDirectory,
  '../public/GameDB',
);

const contentTypes = new Map([
  ['.aac', 'audio/aac'],
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.json', 'application/json'],
  ['.m4a', 'audio/mp4'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.ogg', 'audio/ogg'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wav', 'audio/wav'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
]);

export function contentTypeFor(filePath) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
}

export function toGameDbKey(sourceRoot, filePath) {
  const relativePath = path.relative(path.resolve(sourceRoot), path.resolve(filePath));
  if (
    !relativePath ||
    path.isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`File escapes the GameDB source root: ${filePath}`);
  }

  return `GameDB/${relativePath.split(path.sep).join('/')}`;
}

export async function resolveGameDbSource(sourcePath = DEFAULT_GAMEDB_SOURCE) {
  const resolvedSource = await realpath(sourcePath);
  const sourceStats = await stat(resolvedSource);
  if (!sourceStats.isDirectory()) {
    throw new Error(`GameDB source must resolve to a directory: ${sourcePath}`);
  }
  return resolvedSource;
}

async function collectDirectory(sourceRoot, directory, inventory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const entryStats = await lstat(absolutePath);

    if (entryStats.isSymbolicLink()) {
      inventory.skipped.push({ path: absolutePath, reason: 'symlink' });
      continue;
    }

    if (entryStats.isDirectory()) {
      await collectDirectory(sourceRoot, absolutePath, inventory);
      continue;
    }

    if (!entryStats.isFile()) {
      inventory.skipped.push({ path: absolutePath, reason: 'non-regular-file' });
      continue;
    }

    const key = toGameDbKey(sourceRoot, absolutePath);
    if (inventory.keys.has(key)) {
      inventory.collisions.push(key);
      continue;
    }

    inventory.keys.add(key);
    inventory.files.push({
      absolutePath,
      contentType: contentTypeFor(absolutePath),
      key,
      size: entryStats.size,
    });
  }
}

export async function collectGameDbFiles(sourcePath = DEFAULT_GAMEDB_SOURCE) {
  const sourceRoot = await resolveGameDbSource(sourcePath);
  const inventory = { collisions: [], files: [], keys: new Set(), skipped: [] };
  await collectDirectory(sourceRoot, sourceRoot, inventory);

  inventory.files.sort((left, right) => left.key.localeCompare(right.key));
  return {
    sourceRoot,
    files: inventory.files,
    skipped: inventory.skipped,
    collisions: inventory.collisions,
  };
}
