import type { GamestateEntry, GamestateStorageMeta, GamestateDelta } from './types';
import { computeEntryId } from './hashUtils';

const DB_NAME = 'morpheus_gamestate';
const DB_VERSION = 1;
const ENTRY_STORE = 'entries';
const META_STORE = 'meta';
const META_KEY = 'meta';

export type GamestateValues = Record<number, number>;

type StoreName = typeof ENTRY_STORE | typeof META_STORE;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRY_STORE)) {
        db.createObjectStore(ENTRY_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error(`Failed IndexedDB request for ${storeName}`));
  });
}

export async function getMeta(): Promise<GamestateStorageMeta | null> {
  const result = await withStore(META_STORE, 'readonly', (store) =>
    store.get(META_KEY),
  );
  return (result as GamestateStorageMeta | undefined) ?? null;
}

export async function setMeta(meta: GamestateStorageMeta): Promise<void> {
  await withStore(META_STORE, 'readwrite', (store) => store.put(meta, META_KEY));
}

export async function saveEntry(entry: GamestateEntry): Promise<void> {
  await withStore(ENTRY_STORE, 'readwrite', (store) => store.put(entry));
}

export async function getEntry(id: string): Promise<GamestateEntry | null> {
  const result = await withStore(ENTRY_STORE, 'readonly', (store) => store.get(id));
  return (result as GamestateEntry | undefined) ?? null;
}

export async function clearAll(): Promise<void> {
  await withStore(ENTRY_STORE, 'readwrite', (store) => store.clear());
  await withStore(META_STORE, 'readwrite', (store) => store.clear());
}

export async function createEntry(params: {
  parentId: string | null;
  sceneId: number;
  delta: GamestateDelta;
}): Promise<GamestateEntry> {
  const { parentId, sceneId, delta } = params;
  const id = await computeEntryId(parentId, delta);
  return {
    id,
    parentId,
    sceneId,
    delta,
    timestamp: Date.now(),
  };
}

export async function resolveValues(
  headId: string,
  genesisValues: GamestateValues,
): Promise<GamestateValues> {
  const chain: GamestateEntry[] = [];
  let currentId: string | null = headId;
  while (currentId) {
    const entry = await getEntry(currentId);
    if (!entry) {
      break;
    }
    chain.push(entry);
    currentId = entry.parentId;
  }

  const resolved: GamestateValues = { ...genesisValues };
  for (const entry of chain.reverse()) {
    for (const [key, value] of Object.entries(entry.delta)) {
      resolved[Number(key)] = value;
    }
  }
  return resolved;
}

export async function getHistoryDepth(headId: string | null): Promise<number> {
  let depth = 0;
  let currentId = headId;
  while (currentId) {
    const entry = await getEntry(currentId);
    if (!entry) {
      break;
    }
    depth += 1;
    currentId = entry.parentId;
  }
  return depth;
}
