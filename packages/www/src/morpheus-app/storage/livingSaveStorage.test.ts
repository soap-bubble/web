import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createLivingSaveSlot,
  deleteLivingSaveSlot,
  importLivingSaveSlot,
  LIVING_SAVE_CATALOG_KEY,
  LIVING_SAVE_DATABASE_NAME,
  LIVING_SAVE_STORE_NAME,
  readLivingSaveCatalog,
  undoLivingSaveDeletion,
  writeLivingSaveCheckpoint,
} from './livingSaveStorage';
import type {
  LivingSaveResult,
  LivingSaveSessionEnvelope,
} from './livingSaveTypes';

const createEnvelope = (
  resumePointId = 'resume-point-1',
): LivingSaveSessionEnvelope => ({
  format: 'morpheus-living-save-session',
  schemaVersion: 1,
  gameDataVersion: 1,
  resumePointId,
  savedAt: 1_700_000_000_000,
  gamestateValues: { 100: 2, 101: 4 },
  activeSceneId: 2000,
  returnSceneId: null,
  rotation: { yaw3600: 1200, pitch: -25 },
});

function expectSuccess<T>(result: LivingSaveResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected storage success, received ${result.code}`);
  }
  return result.value;
}

function deleteLivingSaveDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(LIVING_SAVE_DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Living-save database remained open'));
  });
}

function writeRawCatalog(record: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LIVING_SAVE_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(LIVING_SAVE_STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(LIVING_SAVE_STORE_NAME, 'readwrite');
      transaction.objectStore(LIVING_SAVE_STORE_NAME).put(record, LIVING_SAVE_CATALOG_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

function writeLegacyMarker(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('morpheus_gamestate', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('meta');
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('meta', 'readwrite');
      transaction.objectStore('meta').put('preserve-me', 'marker');
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

function readLegacyMarker(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('morpheus_gamestate', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('meta', 'readonly');
      const markerRequest = transaction.objectStore('meta').get('marker');
      markerRequest.onsuccess = () => resolve(markerRequest.result);
      markerRequest.onerror = () => reject(markerRequest.error);
      transaction.oncomplete = () => database.close();
    };
  });
}

describe('living-save storage', () => {
  beforeEach(deleteLivingSaveDatabase);
  afterEach(deleteLivingSaveDatabase);

  it('initializes one catalog with exactly three empty slots', async () => {
    const catalog = expectSuccess(await readLivingSaveCatalog());

    expect(catalog.activeSlotId).toBeNull();
    expect(Object.keys(catalog.slots)).toEqual(['slot-1', 'slot-2', 'slot-3']);
    expect(Object.values(catalog.slots).map((slot) => slot.kind)).toEqual([
      'empty',
      'empty',
      'empty',
    ]);
  });

  it('round-trips the complete logical session without touching legacy data', async () => {
    await writeLegacyMarker();
    const initial = expectSuccess(await readLivingSaveCatalog());
    const envelope = createEnvelope();
    const created = expectSuccess(
      await createLivingSaveSlot({
        slotId: 'slot-2',
        envelope,
        expectedCatalogRevision: initial.revision,
        activate: true,
      }),
    );

    expect(created.slots['slot-2']).toEqual({
      kind: 'occupied',
      slotId: 'slot-2',
      revision: 1,
      envelope,
    });
    expect(await readLegacyMarker()).toBe('preserve-me');
  });

  it('keeps an unloadable raw slot from hiding healthy siblings', async () => {
    await writeRawCatalog({
      format: 'morpheus-living-save-catalog',
      schemaVersion: 1,
      revision: 4,
      activeSlotId: null,
      slots: {
        'slot-1': { revision: 3, payload: { corrupted: true } },
        'slot-2': { revision: 0, payload: null },
        'slot-3': { revision: 0, payload: null },
      },
      tombstones: {},
    });

    const catalog = expectSuccess(await readLivingSaveCatalog());

    expect(catalog.slots['slot-1']).toMatchObject({ kind: 'unloadable', revision: 3 });
    expect(catalog.slots['slot-2']).toMatchObject({ kind: 'empty', revision: 0 });
  });

  it('deletes and restores an unloadable slot without rewriting its raw payload', async () => {
    const rawPayload = { corrupted: true, keep: ['every', 'byte'] };
    await writeRawCatalog({
      format: 'morpheus-living-save-catalog',
      schemaVersion: 1,
      revision: 4,
      activeSlotId: null,
      slots: {
        'slot-1': { revision: 3, payload: rawPayload },
        'slot-2': { revision: 0, payload: null },
        'slot-3': { revision: 0, payload: null },
      },
      tombstones: {},
    });

    const catalog = expectSuccess(await readLivingSaveCatalog());
    const deleted = expectSuccess(
      await deleteLivingSaveSlot({
        slotId: 'slot-1',
        expectedCatalogRevision: catalog.revision,
        expectedSlotRevision: catalog.slots['slot-1'].revision,
        now: 100,
      }),
    );
    await undoLivingSaveDeletion({
      slotId: 'slot-1',
      expectedCatalogRevision: deleted.revision,
      expectedSlotRevision: deleted.slots['slot-1'].revision,
      now: 101,
    });

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(LIVING_SAVE_DATABASE_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stored = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(LIVING_SAVE_STORE_NAME, 'readonly');
      const request = transaction
        .objectStore(LIVING_SAVE_STORE_NAME)
        .get(LIVING_SAVE_CATALOG_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });

    expect(stored).toMatchObject({
      slots: {
        'slot-1': { revision: 3, payload: rawPayload },
      },
    });
  });

  it('preserves a malformed whole catalog instead of replacing it', async () => {
    const malformed = { format: 'unknown-catalog', precious: true };
    await writeRawCatalog(malformed);

    expect(await readLivingSaveCatalog()).toMatchObject({
      ok: false,
      code: 'invalid-data',
    });

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(LIVING_SAVE_DATABASE_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stored = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(LIVING_SAVE_STORE_NAME, 'readonly');
      const request = transaction
        .objectStore(LIVING_SAVE_STORE_NAME)
        .get(LIVING_SAVE_CATALOG_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
    expect(stored).toEqual(malformed);
  });

  it('rejects import into an occupied slot without changing the catalog', async () => {
    const initial = expectSuccess(await readLivingSaveCatalog());
    const created = expectSuccess(
      await createLivingSaveSlot({
        slotId: 'slot-1',
        envelope: createEnvelope(),
        expectedCatalogRevision: initial.revision,
        activate: true,
      }),
    );

    const result = await importLivingSaveSlot({
      slotId: 'slot-1',
      envelope: createEnvelope('imported'),
      expectedCatalogRevision: created.revision,
      expectedSlotRevision: created.slots['slot-1'].revision,
    });

    expect(result).toMatchObject({ ok: false, code: 'occupied-target' });
    expect(expectSuccess(await readLivingSaveCatalog())).toEqual(created);
  });

  it('restores the exact deleted slot only during its Undo window', async () => {
    const initial = expectSuccess(await readLivingSaveCatalog());
    const created = expectSuccess(
      await createLivingSaveSlot({
        slotId: 'slot-1',
        envelope: createEnvelope(),
        expectedCatalogRevision: initial.revision,
        activate: true,
      }),
    );
    const deleted = expectSuccess(
      await deleteLivingSaveSlot({
        slotId: 'slot-1',
        expectedCatalogRevision: created.revision,
        expectedSlotRevision: created.slots['slot-1'].revision,
        now: 100,
      }),
    );
    const restored = expectSuccess(
      await undoLivingSaveDeletion({
        slotId: 'slot-1',
        expectedCatalogRevision: deleted.revision,
        expectedSlotRevision: deleted.slots['slot-1'].revision,
        now: 10_099,
      }),
    );

    expect(restored.slots['slot-1']).toMatchObject({
      kind: 'occupied',
      envelope: createEnvelope(),
    });

    const deletedAgain = expectSuccess(
      await deleteLivingSaveSlot({
        slotId: 'slot-1',
        expectedCatalogRevision: restored.revision,
        expectedSlotRevision: restored.slots['slot-1'].revision,
        now: 200,
      }),
    );
    const expired = await undoLivingSaveDeletion({
      slotId: 'slot-1',
      expectedCatalogRevision: deletedAgain.revision,
      expectedSlotRevision: deletedAgain.slots['slot-1'].revision,
      now: 10_201,
    });

    expect(expired).toMatchObject({ ok: false, code: 'undo-expired' });
    expect(expectSuccess(await readLivingSaveCatalog()).slots['slot-1']).toMatchObject({
      kind: 'empty',
    });
  });

  it('allows one revision-matched checkpoint and conflicts the stale writer', async () => {
    const initial = expectSuccess(await readLivingSaveCatalog());
    const created = expectSuccess(
      await createLivingSaveSlot({
        slotId: 'slot-1',
        envelope: createEnvelope(),
        expectedCatalogRevision: initial.revision,
        activate: true,
      }),
    );
    const results = await Promise.all([
      writeLivingSaveCheckpoint({
        slotId: 'slot-1',
        expectedCatalogRevision: created.revision,
        expectedSlotRevision: created.slots['slot-1'].revision,
        envelope: createEnvelope('writer-a'),
      }),
      writeLivingSaveCheckpoint({
        slotId: 'slot-1',
        expectedCatalogRevision: created.revision,
        expectedSlotRevision: created.slots['slot-1'].revision,
        envelope: createEnvelope('writer-b'),
      }),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      expect.objectContaining({ code: 'conflict' }),
    ]);
  });
});
