import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { collectGameDbFiles, toGameDbKey } from './gamedb-paths.mjs';
import { importGameDb, parseArguments, verifyCurrentEtags } from './upload-gamedb.mjs';

const temporaryDirectories = [];

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'morpheus-gamedb-'));
  temporaryDirectories.push(root);
  const gameDb = path.join(root, 'GameDB');
  await mkdir(path.join(gameDb, 'DeckOne'), { recursive: true });
  await writeFile(path.join(gameDb, 'DeckOne', 'Intro.MP4'), 'movie');
  await writeFile(path.join(gameDb, 'DeckOne', 'lowercase.ogg'), 'audio');
  await symlink(gameDb, path.join(gameDb, 'self'));
  return { root, gameDb };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('GameDB import path collection', () => {
  it('collects regular files once and skips a self-referential symlink', async () => {
    const { gameDb } = await createFixture();

    const inventory = await collectGameDbFiles(gameDb);

    expect(inventory.files.map((file) => file.key)).toEqual([
      'GameDB/DeckOne/Intro.MP4',
      'GameDB/DeckOne/lowercase.ogg',
    ]);
    expect(inventory.skipped).toEqual([
      expect.objectContaining({ reason: 'symlink' }),
    ]);
  });

  it('preserves casing and adds exactly one GameDB prefix', async () => {
    const { gameDb } = await createFixture();

    expect(toGameDbKey(gameDb, path.join(gameDb, 'DeckOne', 'Intro.MP4'))).toBe(
      'GameDB/DeckOne/Intro.MP4',
    );
  });

  it('rejects a file outside the allowed GameDB root', async () => {
    const { gameDb, root } = await createFixture();

    expect(() => toGameDbKey(gameDb, path.join(root, 'outside.mp4'))).toThrow(
      'escapes the GameDB source root',
    );
  });

  it('writes a complete dry-run inventory report without uploading media', async () => {
    const { gameDb, root } = await createFixture();
    const reportPath = path.join(root, 'gamedb-report.json');

    const report = await importGameDb({
      dryRun: true,
      report: reportPath,
      source: gameDb,
      update: false,
    });

    expect(report.summary).toEqual({
      collisions: 0,
      discovered: 2,
      errors: 0,
      expected: 2,
      skipped: 1,
      uploaded: 0,
    });
    expect(JSON.parse(await readFile(reportPath, 'utf8')).files).toEqual([
      expect.objectContaining({ pathname: 'GameDB/DeckOne/Intro.MP4' }),
      expect.objectContaining({ pathname: 'GameDB/DeckOne/lowercase.ogg' }),
    ]);
  });

  it('requires a complete prior ETag inventory before a stable-path update', async () => {
    const { gameDb, root } = await createFixture();
    const previousReportPath = path.join(root, 'previous-gamedb-report.json');
    const reportPath = path.join(root, 'gamedb-report.json');
    await writeFile(
      previousReportPath,
      JSON.stringify({
        files: [
          { etag: 'old-intro', pathname: 'GameDB/DeckOne/Intro.MP4' },
          { etag: 'old-audio', pathname: 'GameDB/DeckOne/lowercase.ogg' },
        ],
      }),
    );

    const report = await importGameDb({
      dryRun: true,
      expect: previousReportPath,
      report: reportPath,
      source: gameDb,
      update: true,
    });

    expect(report.mode).toBe('update');
    expect(report.summary.expected).toBe(2);
  });

  it('stops a stable-path update when the current Blob ETag changed', async () => {
    const { gameDb } = await createFixture();
    const inventory = await collectGameDbFiles(gameDb);
    const expectedEtags = new Map(
      inventory.files.map((file) => [file.key, `expected-${file.key}`]),
    );

    await expect(
      verifyCurrentEtags(inventory.files, expectedEtags, async (key) => ({
        etag: key === inventory.files[0].key ? 'changed' : `expected-${key}`,
      })),
    ).rejects.toThrow(`Current Blob ETag differs for ${inventory.files[0].key}`);
  });

  it('accepts a bounded resumable import configuration', () => {
    expect(() =>
      parseArguments(['--resume', '--concurrency', '16', '--report', '/tmp/gamedb-report.json']),
    ).toThrow('requires --expect');
  });

  it('accepts a resumable import with its partial report', () => {
    expect(
      parseArguments([
        '--resume',
        '--expect',
        '/tmp/partial-report.json',
        '--concurrency',
        '16',
        '--report',
        '/tmp/gamedb-report.json',
      ]),
    ).toMatchObject({ concurrency: 16, resume: true, update: false });
  });

  it('rejects resume mode for a stable-path update', () => {
    expect(() =>
      parseArguments([
        '--resume',
        '--update',
        '--expect',
        '/tmp/previous-report.json',
        '--report',
        '/tmp/gamedb-report.json',
      ]),
    ).toThrow('only for an interrupted initial import');
  });
});
