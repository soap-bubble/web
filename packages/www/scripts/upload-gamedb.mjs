import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { collectGameDbFiles, DEFAULT_GAMEDB_SOURCE } from './gamedb-paths.mjs';

const CACHE_CONTROL_MAX_AGE = 86_400;
const DEFAULT_UPLOAD_CONCURRENCY = 3;
const MAX_UPLOAD_CONCURRENCY = 32;

function usage() {
  return [
    'Usage: yarn workspace morpheus-next upload:gamedb -- --report <report.json> [--source <GameDB>] [--concurrency <1-32>] [--dry-run]',
    '       yarn workspace morpheus-next upload:gamedb -- --update --expect <previous-report.json> --report <report.json> [--source <GameDB>]',
    '       yarn workspace morpheus-next upload:gamedb -- --resume --expect <partial-report.json> --concurrency <1-32> --report <report.json> [--source <GameDB>]',
    '',
    'An update requires the prior report so an operator compares the recorded ETags before allowing stable-path overwrite.',
  ].join('\n');
}

export function parseArguments(args) {
  const options = {
    concurrency: DEFAULT_UPLOAD_CONCURRENCY,
    dryRun: false,
    resume: false,
    source: DEFAULT_GAMEDB_SOURCE,
    update: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--update') options.update = true;
    else if (argument === '--resume') options.resume = true;
    else if (argument === '--concurrency') {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 1 || value > MAX_UPLOAD_CONCURRENCY) {
        throw new Error(`--concurrency must be an integer from 1 to ${MAX_UPLOAD_CONCURRENCY}.`);
      }
      options.concurrency = value;
      index += 1;
    }
    else if (argument === '--source' || argument === '--report' || argument === '--expect') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
      options[argument.slice(2)] = path.resolve(value);
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true };
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.report) throw new Error('A --report path is required to record uploaded ETags.');
  if (options.update && !options.expect) {
    throw new Error('--update requires --expect <previous-report.json> with the prior ETag inventory.');
  }
  if (!options.update && !options.resume && options.expect) {
    throw new Error('--expect is only valid with --update or --resume.');
  }
  if (options.resume && options.update) {
    throw new Error('--resume is only for an interrupted initial import; use --update with --expect for changes.');
  }
  if (options.resume && !options.expect) {
    throw new Error('--resume requires --expect <partial-report.json> to verify already uploaded Blobs.');
  }
  return options;
}

async function readExpectedEtags(reportPath) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(reportPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read expected inventory report ${reportPath}: ${error.message}`);
  }
  if (!Array.isArray(parsed.files)) {
    throw new Error('Expected inventory report must contain a files array with pathname and etag values.');
  }

  const etags = new Map();
  for (const file of parsed.files) {
    if (typeof file?.pathname !== 'string' || typeof file?.etag !== 'string' || !file.etag) {
      throw new Error('Expected inventory report contains a file without a pathname and ETag.');
    }
    if (etags.has(file.pathname)) throw new Error(`Expected inventory report repeats ${file.pathname}.`);
    etags.set(file.pathname, file.etag);
  }
  return etags;
}

function assertMatchingInventory(files, expectedEtags) {
  if (files.length !== expectedEtags.size) {
    throw new Error('Expected inventory does not match the source GameDB file count. Refuse partial or stale update.');
  }
  for (const file of files) {
    if (!expectedEtags.has(file.key)) {
      throw new Error(`Expected inventory is missing ${file.key}. Refuse update without a recorded ETag.`);
    }
  }
}

export async function verifyCurrentEtags(files, expectedEtags, head) {
  for (const file of files) {
    const current = await head(file.key);
    const expected = expectedEtags.get(file.key);
    if (current.etag !== expected) {
      throw new Error(`Current Blob ETag differs for ${file.key}. Refuse stale stable-path update.`);
    }
  }
}

function makeReport({ inventory, options, uploaded, errors, files }) {
  return {
    cacheControlMaxAge: CACHE_CONTROL_MAX_AGE,
    files,
    generatedAt: new Date().toISOString(),
    mode: options.update ? 'update' : 'initial-import',
    sourceRoot: inventory.sourceRoot,
    summary: {
      collisions: inventory.collisions.length,
      discovered: inventory.files.length,
      errors: errors.length,
      expected: inventory.files.length,
      skipped: inventory.skipped.length,
      uploaded,
    },
    skipped: inventory.skipped,
  };
}

async function writeReport(reportPath, report) {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export async function importGameDb(options) {
  const inventory = await collectGameDbFiles(options.source);
  if (inventory.collisions.length) {
    throw new Error(`GameDB inventory has duplicate Blob keys: ${inventory.collisions.join(', ')}`);
  }

  const expectedEtags = options.update ? await readExpectedEtags(options.expect) : null;
  const resumedEtags = options.resume ? await readExpectedEtags(options.expect) : null;
  if (expectedEtags) assertMatchingInventory(inventory.files, expectedEtags);

  let uploaded = 0;
  const errors = [];
  if (options.dryRun) {
    const report = makeReport({
      inventory,
      options,
      uploaded: 0,
      errors,
      files: inventory.files.map(({ contentType, key, size }) => ({ contentType, pathname: key, size })),
    });
    await writeReport(options.report, report);
    return report;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for an upload.');
  }
  const { BlobNotFoundError, head, put } = await import('@vercel/blob');
  if (expectedEtags) {
    await verifyCurrentEtags(inventory.files, expectedEtags, head);
  }

  const results = new Array(inventory.files.length);
  let nextFileIndex = 0;
  const uploadWorker = async () => {
    while (nextFileIndex < inventory.files.length) {
      const fileIndex = nextFileIndex;
      nextFileIndex += 1;
      const file = inventory.files[fileIndex];
      try {
        if (options.resume) {
          try {
            const existing = await head(file.key);
            const expectedEtag = resumedEtags.get(file.key);
            if (!expectedEtag) {
              throw new Error(
                `Existing Blob ${file.key} is not present in the partial import report. Refuse resume.`,
              );
            }
            if (existing.etag !== expectedEtag || existing.size !== file.size) {
              throw new Error(
                `Existing Blob differs from the partial import report for ${file.key}. Refuse resume.`,
              );
            }
            results[fileIndex] = {
              contentType: file.contentType,
              etag: existing.etag,
              pathname: existing.pathname,
              size: file.size,
              url: existing.url,
            };
            continue;
          } catch (error) {
            if (!(error instanceof BlobNotFoundError)) throw error;
            if (resumedEtags.has(file.key)) {
              throw new Error(
                `Blob ${file.key} is recorded in the partial import report but no longer exists. Refuse resume.`,
              );
            }
          }
        }
        const blob = await put(file.key, Readable.toWeb(createReadStream(file.absolutePath)), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: options.update,
          cacheControlMaxAge: CACHE_CONTROL_MAX_AGE,
          contentType: file.contentType,
        });
        results[fileIndex] = {
          contentType: file.contentType,
          etag: blob.etag,
          pathname: blob.pathname,
          size: file.size,
          url: blob.url,
        };
        uploaded += 1;
      } catch (error) {
        errors.push({ pathname: file.key, message: error instanceof Error ? error.message : String(error) });
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(options.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY, inventory.files.length) },
      uploadWorker,
    ),
  );

  const report = makeReport({ inventory, options, uploaded, errors, files: results.filter(Boolean) });
  await writeReport(options.report, report);
  if (errors.length) {
    throw new Error(`${errors.length} GameDB files failed to upload. See ${options.report}.`);
  }
  return report;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const report = await importGameDb(options);
    console.log(JSON.stringify(report.summary));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage());
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
