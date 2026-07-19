import { z } from 'zod';

import { parseLivingSaveSessionEnvelope } from './livingSaveSchema';
import {
  LIVING_SAVE_CATALOG_FORMAT,
  LIVING_SAVE_CATALOG_SCHEMA_VERSION,
  LIVING_SAVE_GAME_DATA_VERSION,
  LIVING_SAVE_SLOT_IDS,
  LIVING_SAVE_UNDO_WINDOW_MS,
} from './livingSaveTypes';
import type {
  LivingSaveCatalog,
  LivingSaveResult,
  LivingSaveSessionEnvelope,
  LivingSaveSlot,
  LivingSaveSlotId,
  RawLivingSaveCatalog,
  RawLivingSaveSlotRecord,
  RawLivingSaveTombstone,
} from './livingSaveTypes';

export const LIVING_SAVE_DATABASE_NAME = 'morpheus_living_saves';
export const LIVING_SAVE_DATABASE_VERSION = 1;
export const LIVING_SAVE_STORE_NAME = 'catalog';
export const LIVING_SAVE_CATALOG_KEY = 'living-save-catalog';

const slotIdSchema = z.enum(LIVING_SAVE_SLOT_IDS);
const rawSlotSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    payload: z.unknown().nullable(),
  })
  .strict();
const rawTombstoneSchema = z
  .object({
    slot: rawSlotSchema,
    deletedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().nonnegative(),
    wasActive: z.boolean(),
  })
  .strict();
const rawCatalogSchema = z
  .object({
    format: z.literal(LIVING_SAVE_CATALOG_FORMAT),
    schemaVersion: z.literal(LIVING_SAVE_CATALOG_SCHEMA_VERSION),
    revision: z.number().int().nonnegative(),
    activeSlotId: slotIdSchema.nullable(),
    slots: z
      .object({
        'slot-1': rawSlotSchema,
        'slot-2': rawSlotSchema,
        'slot-3': rawSlotSchema,
      })
      .strict(),
    tombstones: z
      .object({
        'slot-1': rawTombstoneSchema.optional(),
        'slot-2': rawTombstoneSchema.optional(),
        'slot-3': rawTombstoneSchema.optional(),
      })
      .strict(),
  })
  .strict();

type CatalogMutation =
  | { ok: true; catalog: RawLivingSaveCatalog }
  | {
      ok: false;
      code: Exclude<
        LivingSaveResult<never>,
        { ok: true }
      >['code'];
      reason?: string;
    };

function createEmptyRawCatalog(): RawLivingSaveCatalog {
  return {
    format: LIVING_SAVE_CATALOG_FORMAT,
    schemaVersion: LIVING_SAVE_CATALOG_SCHEMA_VERSION,
    revision: 0,
    activeSlotId: null,
    slots: {
      'slot-1': { revision: 0, payload: null },
      'slot-2': { revision: 0, payload: null },
      'slot-3': { revision: 0, payload: null },
    },
    tombstones: {},
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(
      LIVING_SAVE_DATABASE_NAME,
      LIVING_SAVE_DATABASE_VERSION,
    );
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LIVING_SAVE_STORE_NAME)) {
        database.createObjectStore(LIVING_SAVE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Unable to open living-save storage'));
  });
}

function parseRawCatalog(value: unknown): RawLivingSaveCatalog | null {
  const parsed = rawCatalogSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function classifySlot(
  slotId: LivingSaveSlotId,
  rawSlot: RawLivingSaveSlotRecord,
): LivingSaveSlot {
  if (rawSlot.payload === null) {
    return { kind: 'empty', slotId, revision: rawSlot.revision };
  }
  const parsed = parseLivingSaveSessionEnvelope(rawSlot.payload);
  if (!parsed.success) {
    return {
      kind: 'unloadable',
      slotId,
      revision: rawSlot.revision,
      reason: parsed.issues.some((issue) => issue.startsWith('Unsupported'))
        ? 'unsupported-version'
        : 'invalid-data',
    };
  }
  if (parsed.data.gameDataVersion !== LIVING_SAVE_GAME_DATA_VERSION) {
    return {
      kind: 'unloadable',
      slotId,
      revision: rawSlot.revision,
      reason: 'unsupported-version',
    };
  }
  return {
    kind: 'occupied',
    slotId,
    revision: rawSlot.revision,
    envelope: parsed.data,
  };
}

function classifyCatalog(raw: RawLivingSaveCatalog): LivingSaveCatalog {
  const slots = {
    'slot-1': classifySlot('slot-1', raw.slots['slot-1']),
    'slot-2': classifySlot('slot-2', raw.slots['slot-2']),
    'slot-3': classifySlot('slot-3', raw.slots['slot-3']),
  };
  const tombstones: LivingSaveCatalog['tombstones'] = {};
  for (const slotId of LIVING_SAVE_SLOT_IDS) {
    const tombstone = raw.tombstones[slotId];
    if (tombstone) {
      tombstones[slotId] = {
        slotId,
        deletedAt: tombstone.deletedAt,
        expiresAt: tombstone.expiresAt,
        wasActive: tombstone.wasActive,
      };
    }
  }
  return {
    format: raw.format,
    schemaVersion: raw.schemaVersion,
    revision: raw.revision,
    activeSlotId: raw.activeSlotId,
    slots,
    tombstones,
  };
}

async function runRawCatalogTransaction<T>(
  mode: IDBTransactionMode,
  mutate: (
    catalog: RawLivingSaveCatalog,
  ) => CatalogMutation,
  select: (catalog: RawLivingSaveCatalog) => T,
): Promise<LivingSaveResult<T>> {
  let database: IDBDatabase;
  try {
    database = await openDatabase();
  } catch (error) {
    return {
      ok: false,
      code: 'unavailable-storage',
      reason: error instanceof Error ? error.message : 'IndexedDB is unavailable',
    };
  }

  return new Promise((resolve) => {
    const transaction = database.transaction(LIVING_SAVE_STORE_NAME, mode);
    const store = transaction.objectStore(LIVING_SAVE_STORE_NAME);
    const request = store.get(LIVING_SAVE_CATALOG_KEY);
    let result: LivingSaveResult<T> | null = null;

    request.onsuccess = () => {
      const raw =
        request.result === undefined
          ? createEmptyRawCatalog()
          : parseRawCatalog(request.result);
      if (!raw) {
        result = {
          ok: false,
          code: 'invalid-data',
          reason: 'The living-save catalog is malformed.',
        };
        return;
      }
      const mutation = mutate(raw);
      if (!mutation.ok) {
        result = mutation;
        return;
      }
      result = { ok: true, value: select(mutation.catalog) };
      if (
        mode === 'readwrite' &&
        (mutation.catalog !== raw || request.result === undefined)
      ) {
        store.put(mutation.catalog, LIVING_SAVE_CATALOG_KEY);
      }
    };
    request.onerror = () => {
      result = {
        ok: false,
        code: 'unavailable-storage',
        reason: request.error?.message ?? 'Unable to read living-save storage',
      };
      transaction.abort();
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(
        result ?? {
          ok: false,
          code: 'unavailable-storage',
          reason: 'Living-save transaction completed without a result.',
        },
      );
    };
    transaction.onerror = () => {
      database.close();
      resolve({
        ok: false,
        code: 'unavailable-storage',
        reason:
          transaction.error?.message ?? 'Living-save transaction failed.',
      });
    };
    transaction.onabort = () => {
      database.close();
      resolve({
        ok: false,
        code: 'unavailable-storage',
        reason:
          transaction.error?.message ?? 'Living-save transaction was aborted.',
      });
    };
  });
}

function runCatalogTransaction(
  mutate: (
    catalog: RawLivingSaveCatalog,
  ) => CatalogMutation,
): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runRawCatalogTransaction('readwrite', mutate, classifyCatalog);
}

function conflict(): CatalogMutation {
  return { ok: false, code: 'conflict' };
}

function withCatalogRevision(
  catalog: RawLivingSaveCatalog,
  expectedCatalogRevision: number,
): CatalogMutation | null {
  return catalog.revision === expectedCatalogRevision ? null : conflict();
}

function updatedCatalog(
  catalog: RawLivingSaveCatalog,
  changes: Partial<RawLivingSaveCatalog>,
): RawLivingSaveCatalog {
  return { ...catalog, ...changes, revision: catalog.revision + 1 };
}

export function readLivingSaveCatalog(): Promise<
  LivingSaveResult<LivingSaveCatalog>
> {
  return runCatalogTransaction((catalog) => ({ ok: true, catalog }));
}

export async function readLivingSaveRawPayload(
  slotId: LivingSaveSlotId,
): Promise<LivingSaveResult<unknown>> {
  const result = await runRawCatalogTransaction(
    'readonly',
    (catalog) => ({ ok: true, catalog }),
    (catalog) => catalog.slots[slotId].payload,
  );
  if (!result.ok) {
    return result;
  }
  if (result.value === null) {
    return { ok: false, code: 'empty-target' };
  }
  return result;
}

export function createLivingSaveSlot(params: {
  slotId: LivingSaveSlotId;
  envelope: LivingSaveSessionEnvelope;
  expectedCatalogRevision: number;
  activate: boolean;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (revisionConflict) return revisionConflict;
    const currentSlot = catalog.slots[params.slotId];
    if (currentSlot.payload !== null) {
      return { ok: false, code: 'occupied-target' };
    }
    const slots = {
      ...catalog.slots,
      [params.slotId]: {
        revision: currentSlot.revision + 1,
        payload: params.envelope,
      },
    };
    return {
      ok: true,
      catalog: updatedCatalog(catalog, {
        slots,
        activeSlotId: params.activate
          ? params.slotId
          : catalog.activeSlotId,
        tombstones: {
          ...catalog.tombstones,
          [params.slotId]: undefined,
        },
      }),
    };
  });
}

export function activateLivingSaveSlot(params: {
  slotId: LivingSaveSlotId;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (
      revisionConflict ||
      catalog.slots[params.slotId].revision !== params.expectedSlotRevision
    ) {
      return conflict();
    }
    if (catalog.slots[params.slotId].payload === null) {
      return { ok: false, code: 'empty-target' };
    }
    if (catalog.activeSlotId === params.slotId) {
      return { ok: true, catalog };
    }
    return {
      ok: true,
      catalog: updatedCatalog(catalog, { activeSlotId: params.slotId }),
    };
  });
}

export function writeLivingSaveCheckpoint(params: {
  slotId: LivingSaveSlotId;
  envelope: LivingSaveSessionEnvelope;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const slot = catalog.slots[params.slotId];
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (
      revisionConflict ||
      slot.revision !== params.expectedSlotRevision ||
      catalog.activeSlotId !== params.slotId
    ) {
      return conflict();
    }
    if (slot.payload === null) {
      return { ok: false, code: 'empty-target' };
    }
    return {
      ok: true,
      catalog: updatedCatalog(catalog, {
        slots: {
          ...catalog.slots,
          [params.slotId]: {
            revision: slot.revision + 1,
            payload: params.envelope,
          },
        },
      }),
    };
  });
}

export function deleteLivingSaveSlot(params: {
  slotId: LivingSaveSlotId;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
  now?: number;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const slot = catalog.slots[params.slotId];
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (
      revisionConflict ||
      slot.revision !== params.expectedSlotRevision
    ) {
      return conflict();
    }
    if (slot.payload === null) {
      return { ok: false, code: 'empty-target' };
    }
    const deletedAt = params.now ?? Date.now();
    const tombstone: RawLivingSaveTombstone = {
      slot,
      deletedAt,
      expiresAt: deletedAt + LIVING_SAVE_UNDO_WINDOW_MS,
      wasActive: catalog.activeSlotId === params.slotId,
    };
    return {
      ok: true,
      catalog: updatedCatalog(catalog, {
        activeSlotId:
          catalog.activeSlotId === params.slotId
            ? null
            : catalog.activeSlotId,
        slots: {
          ...catalog.slots,
          [params.slotId]: {
            revision: slot.revision + 1,
            payload: null,
          },
        },
        tombstones: {
          ...catalog.tombstones,
          [params.slotId]: tombstone,
        },
      }),
    };
  });
}

export function undoLivingSaveDeletion(params: {
  slotId: LivingSaveSlotId;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
  now?: number;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const slot = catalog.slots[params.slotId];
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (
      revisionConflict ||
      slot.revision !== params.expectedSlotRevision
    ) {
      return conflict();
    }
    const tombstone = catalog.tombstones[params.slotId];
    if (!tombstone) {
      return { ok: false, code: 'undo-unavailable' };
    }
    const now = params.now ?? Date.now();
    if (now > tombstone.expiresAt) {
      return { ok: false, code: 'undo-expired' };
    }
    if (slot.payload !== null) {
      return { ok: false, code: 'occupied-target' };
    }
    return {
      ok: true,
      catalog: updatedCatalog(catalog, {
        activeSlotId: tombstone.wasActive
          ? params.slotId
          : catalog.activeSlotId,
        slots: {
          ...catalog.slots,
          [params.slotId]: tombstone.slot,
        },
        tombstones: {
          ...catalog.tombstones,
          [params.slotId]: undefined,
        },
      }),
    };
  });
}

export function importLivingSaveSlot(params: {
  slotId: LivingSaveSlotId;
  envelope: LivingSaveSessionEnvelope;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
}): Promise<LivingSaveResult<LivingSaveCatalog>> {
  return runCatalogTransaction((catalog) => {
    const slot = catalog.slots[params.slotId];
    const revisionConflict = withCatalogRevision(
      catalog,
      params.expectedCatalogRevision,
    );
    if (
      revisionConflict ||
      slot.revision !== params.expectedSlotRevision
    ) {
      return conflict();
    }
    if (slot.payload !== null) {
      return { ok: false, code: 'occupied-target' };
    }
    return {
      ok: true,
      catalog: updatedCatalog(catalog, {
        slots: {
          ...catalog.slots,
          [params.slotId]: {
            revision: slot.revision + 1,
            payload: params.envelope,
          },
        },
        tombstones: {
          ...catalog.tombstones,
          [params.slotId]: undefined,
        },
      }),
    };
  });
}

export async function readLivingSaveEnvelope(
  slotId: LivingSaveSlotId,
): Promise<LivingSaveResult<LivingSaveSessionEnvelope>> {
  const catalogResult = await readLivingSaveCatalog();
  if (!catalogResult.ok) return catalogResult;
  const slot = catalogResult.value.slots[slotId];
  if (slot.kind === 'empty') {
    return { ok: false, code: 'empty-target' };
  }
  if (slot.kind === 'unloadable') {
    return { ok: false, code: 'invalid-data' };
  }
  return { ok: true, value: slot.envelope };
}
