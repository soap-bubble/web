import { describe, expect, it, vi } from 'vitest';
import type { Scene } from 'morpheus/casts/types';

import { createLivingSaveCoordinator } from './livingSaveCoordinator';
import { createAppStore } from './store';
import {
  createEmptyLivingSaveCatalogFixture,
  createLivingSaveEnvelopeFixture,
  occupyLivingSaveSlot,
} from './testFixtures';
import type {
  LivingSaveCatalog,
  LivingSaveValidationResult,
} from '@/morpheus-app/storage/livingSaveTypes';

const scene = (sceneId: number): Scene => ({
  sceneId,
  cdFlags: 0,
  sceneType: 0,
  palette: 0,
  casts: [],
});

function createHarness(catalog: LivingSaveCatalog) {
  const store = createAppStore();
  const replacedRoutes: number[] = [];
  let titleVisits = 0;
  let validateEnvelope = async (
    envelope: Parameters<
      Parameters<typeof createLivingSaveCoordinator>[0]['validateEnvelope']
    >[0],
  ): Promise<LivingSaveValidationResult> => ({ ok: true, envelope });
  const coordinator = createLivingSaveCoordinator({
    dispatch: store.dispatch,
    getState: store.getState,
    readCatalog: async () => ({ ok: true, value: catalog }),
    activateSlot: async () => ({ ok: true, value: catalog }),
    createSlot: async () => ({ ok: true, value: catalog }),
    validateEnvelope: (envelope) => validateEnvelope(envelope),
    fetchScene: async (sceneId) => scene(sceneId),
    replaceRoute: (sceneId) => replacedRoutes.push(sceneId),
    goToTitle: () => {
      titleVisits += 1;
    },
  });
  return {
    store,
    coordinator,
    replacedRoutes,
    titleVisits: () => titleVisits,
    setValidation: (next: typeof validateEnvelope) => {
      validateEnvelope = next;
    },
  };
}

describe('livingSaveCoordinator', () => {
  it('lets a valid active slot outrank a conflicting route scene', async () => {
    const envelope = createLivingSaveEnvelopeFixture({ activeSceneId: 2000 });
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      envelope,
    );
    const harness = createHarness(catalog);

    await harness.coordinator.bootstrap({
      routeSceneId: 1050,
      mcpSessionName: null,
    });

    expect(harness.store.getState().scene.activeSceneId).toBe(2000);
    expect(harness.replacedRoutes).toEqual([2000]);
  });

  it('returns normal direct navigation to title when no slot is active', async () => {
    const harness = createHarness(createEmptyLivingSaveCatalogFixture());

    await harness.coordinator.bootstrap({
      routeSceneId: 1050,
      mcpSessionName: null,
    });

    expect(harness.titleVisits()).toBe(1);
    expect(harness.store.getState().scene.activeSceneId).toBeNull();
  });

  it('admits a named development scene as volatile without an active slot', async () => {
    const harness = createHarness(createEmptyLivingSaveCatalogFixture());

    await harness.coordinator.bootstrap({
      routeSceneId: 1050,
      mcpSessionName: 'test-session',
    });

    expect(harness.store.getState().scene.activeSceneId).toBe(1050);
    expect(harness.store.getState().livingSaves).toMatchObject({
      activeSlotId: null,
      saveHealth: 'volatile',
    });
  });

  it('leaves live runtime untouched when the active envelope is unloadable', async () => {
    const envelope = createLivingSaveEnvelopeFixture();
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      envelope,
    );
    const harness = createHarness(catalog);
    harness.setValidation(
      async (): Promise<LivingSaveValidationResult> => ({
        ok: false,
        code: 'unavailable-scene',
        reason: 'missing scene',
      }),
    );

    await harness.coordinator.bootstrap({
      routeSceneId: 1050,
      mcpSessionName: null,
    });

    expect(harness.store.getState().scene.activeSceneId).toBeNull();
    expect(harness.store.getState().gamestate.byId).toEqual(
      createAppStore().getState().gamestate.byId,
    );
    expect(harness.store.getState().livingSaves.slots[0]).toMatchObject({
      state: 'unloadable',
      unloadableReason: 'unavailable-scene',
    });
  });

  it('installs an empty slot only after its durable genesis record is created', async () => {
    const catalog = createEmptyLivingSaveCatalogFixture();
    const createdCatalog = occupyLivingSaveSlot(
      catalog,
      'slot-2',
      createLivingSaveEnvelopeFixture({ activeSceneId: 2000 }),
    );
    const store = createAppStore();
    const creationControl: { resolve: (() => void) | null } = { resolve: null };
    const creation = new Promise<void>((resolve) => {
      creationControl.resolve = resolve;
    });
    const createStartControl: { resolve: (() => void) | null } = {
      resolve: null,
    };
    const createStarted = new Promise<void>((resolve) => {
      createStartControl.resolve = resolve;
    });
    const createSlotCalls: Array<{ slotId: string; activate: boolean }> = [];
    const coordinator = createLivingSaveCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      readCatalog: async () => ({ ok: true, value: catalog }),
      activateSlot: async () => ({ ok: true, value: catalog }),
      createSlot: async ({ slotId, activate }) => {
        createSlotCalls.push({ slotId, activate });
        createStartControl.resolve?.();
        await creation;
        return { ok: true, value: createdCatalog };
      },
      validateEnvelope: async (envelope) => ({ ok: true, envelope }),
      fetchScene: async (sceneId) => scene(sceneId),
      replaceRoute: () => undefined,
      goToTitle: () => undefined,
    });

    const created = coordinator.createNewSlot('slot-2');

    await createStarted;
    expect(createSlotCalls).toEqual([{ slotId: 'slot-2', activate: true }]);
    expect(store.getState().livingSaves.activeSlotId).toBeNull();

    const resolveCreate = creationControl.resolve;
    if (resolveCreate === null) {
      throw new Error('Expected the durable create operation to be pending');
    }
    resolveCreate();

    await expect(created).resolves.toEqual({ ok: true, kind: 'created' });
    expect(store.getState().livingSaves).toMatchObject({
      activeSlotId: 'slot-2',
      saveHealth: 'saved',
    });
    expect(store.getState().scene.activeSceneId).toBe(2000);
  });

  it('ignores a stale restore completion after a newer operation succeeds', async () => {
    const firstEnvelope = createLivingSaveEnvelopeFixture({
      resumePointId: 'first',
      activeSceneId: 2000,
    });
    const secondEnvelope = createLivingSaveEnvelopeFixture({
      resumePointId: 'second',
      activeSceneId: 1050,
    });
    let catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      firstEnvelope,
    );
    catalog = {
      ...catalog,
      revision: catalog.revision + 1,
      slots: {
        ...catalog.slots,
        'slot-2': {
          kind: 'occupied',
          slotId: 'slot-2',
          revision: 1,
          envelope: secondEnvelope,
        },
      },
    };
    const store = createAppStore();
    let releaseFirst: () => void = () => undefined;
    const firstValidation = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const coordinator = createLivingSaveCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      readCatalog: async () => ({ ok: true, value: catalog }),
      activateSlot: async ({ slotId }) => ({
        ok: true,
        value: { ...catalog, activeSlotId: slotId },
      }),
      createSlot: async () => ({ ok: true, value: catalog }),
      validateEnvelope: async (envelope) => {
        if (envelope.resumePointId === 'first') await firstValidation;
        return { ok: true, envelope };
      },
      fetchScene: async (sceneId) => scene(sceneId),
      replaceRoute: () => undefined,
      goToTitle: () => undefined,
    });

    const stale = coordinator.restoreSlot('slot-1');
    await coordinator.restoreSlot('slot-2');
    releaseFirst();
    await stale;

    expect(store.getState().scene.activeSceneId).toBe(1050);
    expect(store.getState().livingSaves.activeSlotId).toBe('slot-2');
  });

  it('deletes only the selected active slot and leaves the running session volatile', async () => {
    const envelope = createLivingSaveEnvelopeFixture();
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      envelope,
    );
    const deletedCatalog: LivingSaveCatalog = {
      ...catalog,
      revision: catalog.revision + 1,
      activeSlotId: null,
      slots: {
        ...catalog.slots,
        'slot-1': {
          kind: 'empty',
          slotId: 'slot-1',
          revision: catalog.slots['slot-1'].revision + 1,
        },
      },
      tombstones: {
        'slot-1': {
          slotId: 'slot-1',
          deletedAt: 100,
          expiresAt: 10_100,
          wasActive: true,
        },
      },
    };
    const store = createAppStore();
    const deleteSlot = vi.fn(async () => ({
      ok: true as const,
      value: deletedCatalog,
    }));
    const coordinator = createLivingSaveCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      readCatalog: async () => ({ ok: true, value: catalog }),
      activateSlot: async () => ({ ok: true, value: catalog }),
      createSlot: async () => ({ ok: true, value: catalog }),
      deleteSlot,
      validateEnvelope: async (value) => ({ ok: true, envelope: value }),
      fetchScene: async (sceneId) => scene(sceneId),
      replaceRoute: () => undefined,
      goToTitle: () => undefined,
    });

    await expect(coordinator.deleteSlot('slot-1')).resolves.toEqual({
      ok: true,
      kind: 'managed',
    });

    expect(deleteSlot).toHaveBeenCalledWith({
      slotId: 'slot-1',
      expectedCatalogRevision: catalog.revision,
      expectedSlotRevision: catalog.slots['slot-1'].revision,
    });
    expect(store.getState().livingSaves).toMatchObject({
      activeSlotId: null,
      saveHealth: 'volatile',
    });
    expect(store.getState().livingSaves.slots[0].state).toBe('empty');
  });

  it('rejects an invalid imported file before mutating an empty slot', async () => {
    const catalog = createEmptyLivingSaveCatalogFixture();
    const store = createAppStore();
    const importSlot = vi.fn();
    const coordinator = createLivingSaveCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      readCatalog: async () => ({ ok: true, value: catalog }),
      activateSlot: async () => ({ ok: true, value: catalog }),
      createSlot: async () => ({ ok: true, value: catalog }),
      importSlot,
      parseFileText: async () => ({
        ok: false,
        code: 'unsupported-version',
        reason: 'Unsupported version',
      }),
      validateEnvelope: async (value) => ({ ok: true, envelope: value }),
      fetchScene: async (sceneId) => scene(sceneId),
      replaceRoute: () => undefined,
      goToTitle: () => undefined,
    });

    await expect(
      coordinator.importFileText('slot-2', '{"gameDataVersion":99}'),
    ).resolves.toEqual({
      ok: false,
      reason: 'unsupported-version',
    });
    expect(importSlot).not.toHaveBeenCalled();
    expect(store.getState().livingSaves.slots[1].state).toBe('empty');
  });
});
