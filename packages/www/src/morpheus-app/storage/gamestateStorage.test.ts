import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { computeEntryId } from './hashUtils';
import {
  clearAll,
  createEntry,
  getHistoryDepth,
  resolveValues,
  saveEntry,
} from './gamestateStorage';

describe('gamestate storage', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('computes deterministic hashes for identical inputs', async () => {
    const delta = { 101: 5, 102: 9 };
    const first = await computeEntryId('parent', delta);
    const second = await computeEntryId('parent', delta);
    expect(first).toBe(second);
  });

  it('changes hash when path differs', async () => {
    const delta = { 101: 5 };
    const first = await computeEntryId('parent-a', delta);
    const second = await computeEntryId('parent-b', delta);
    expect(first).not.toBe(second);
  });

  it('resolves values from stored chain', async () => {
    const genesis = { 1: 0, 2: 5 };
    const first = await createEntry({ parentId: null, sceneId: 10, delta: { 1: 2 } });
    await saveEntry(first);
    const second = await createEntry({ parentId: first.id, sceneId: 20, delta: { 2: 9 } });
    await saveEntry(second);

    const resolved = await resolveValues(second.id, genesis);
    expect(resolved).toEqual({ 1: 2, 2: 9 });
  });

  it('computes history depth from head', async () => {
    const first = await createEntry({ parentId: null, sceneId: 10, delta: { 1: 2 } });
    await saveEntry(first);
    const second = await createEntry({ parentId: first.id, sceneId: 20, delta: { 2: 9 } });
    await saveEntry(second);

    const depth = await getHistoryDepth(second.id);
    expect(depth).toBe(2);
  });
});
