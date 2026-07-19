import { describe, expect, it } from 'vitest';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Scene } from 'morpheus/casts/types';

import { installLivingSaveRuntime } from './actions';
import { createLivingSaveCheckpointCoordinator } from './livingSaveCheckpoint';
import { updateGamestate } from './slices/gamestateSlice';
import { createAppStore } from './store';
import {
  createEmptyLivingSaveCatalogFixture,
  createLivingSaveEnvelopeFixture,
  occupyLivingSaveSlot,
} from './testFixtures';

const scene = (sceneId: number): Scene => ({
  sceneId,
  cdFlags: 0,
  sceneType: 0,
  palette: 0,
  casts: [],
});

describe('living-save checkpoints', () => {
  it('captures one complete immutable resume point after a stable action', async () => {
    const store = createAppStore();
    const initial = fetchInitial();
    const values = Object.fromEntries(
      initial.map((gamestate) => [gamestate.stateId, gamestate.value]),
    );
    const original = createLivingSaveEnvelopeFixture({
      gamestateValues: values,
    });
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      original,
    );
    store.dispatch(
      installLivingSaveRuntime({
        operationId: 'install',
        catalog,
        slotId: 'slot-1',
        envelope: original,
        activeScene: scene(2000),
        returnScene: null,
        saveHealth: 'saved',
        skipSceneEntryActions: false,
      }),
    );
    const changed = initial[0];
    store.dispatch(
      updateGamestate({
        stateId: changed.stateId,
        value: Math.min(changed.maxValue, changed.value + 1),
      }),
    );
    const writes: Array<{
      envelope: typeof original;
      expectedCatalogRevision: number;
      expectedSlotRevision: number;
    }> = [];
    const checkpoints = createLivingSaveCheckpointCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      writeCheckpoint: async (params) => {
        writes.push(params);
        return {
          ok: true,
          value: {
            ...catalog,
            revision: catalog.revision + 1,
            slots: {
              ...catalog.slots,
              'slot-1': {
                kind: 'occupied',
                slotId: 'slot-1',
                revision: 2,
                envelope: params.envelope,
              },
            },
          },
        };
      },
      now: () => 1_800_000_000_000,
      createResumePointId: () => 'next-resume',
    });

    await checkpoints.requestCheckpoint(1);

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      expectedCatalogRevision: catalog.revision,
      expectedSlotRevision: 1,
      envelope: {
        resumePointId: 'next-resume',
        savedAt: 1_800_000_000_000,
        activeSceneId: 2000,
        returnSceneId: null,
        rotation: { yaw3600: 1200, pitch: -20 },
      },
    });
    expect(Object.keys(writes[0].envelope.gamestateValues)).toHaveLength(
      new Set(initial.map((gamestate) => gamestate.stateId)).size,
    );
  });

  it('does not write for a volatile runtime or stale generation', async () => {
    const store = createAppStore();
    let writes = 0;
    const checkpoints = createLivingSaveCheckpointCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      writeCheckpoint: async () => {
        writes += 1;
        return { ok: false, code: 'conflict' };
      },
      now: Date.now,
      createResumePointId: () => 'unused',
    });

    await checkpoints.requestCheckpoint(0);
    await checkpoints.requestCheckpoint(99);

    expect(writes).toBe(0);
  });

  it('does not overwrite a durable save with background scene zero', async () => {
    const store = createAppStore();
    const original = createLivingSaveEnvelopeFixture();
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      original,
    );
    store.dispatch(
      installLivingSaveRuntime({
        operationId: 'install',
        catalog,
        slotId: 'slot-1',
        envelope: original,
        activeScene: scene(0),
        returnScene: null,
        saveHealth: 'saved',
        skipSceneEntryActions: false,
      }),
    );
    let writes = 0;
    const checkpoints = createLivingSaveCheckpointCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      writeCheckpoint: async () => {
        writes += 1;
        return { ok: false, code: 'conflict' };
      },
      now: Date.now,
      createResumePointId: () => 'unused',
    });

    await checkpoints.requestCheckpoint(1);

    expect(writes).toBe(0);
  });

  it('recovers from a rejected storage write', async () => {
    const store = createAppStore();
    const original = createLivingSaveEnvelopeFixture();
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      original,
    );
    store.dispatch(
      installLivingSaveRuntime({
        operationId: 'install',
        catalog,
        slotId: 'slot-1',
        envelope: original,
        activeScene: scene(original.activeSceneId),
        returnScene: null,
        saveHealth: 'saved',
        skipSceneEntryActions: false,
      }),
    );
    const checkpoints = createLivingSaveCheckpointCoordinator({
      dispatch: store.dispatch,
      getState: store.getState,
      writeCheckpoint: async () => {
        throw new Error('IndexedDB unavailable');
      },
      now: Date.now,
      createResumePointId: () => 'unused',
    });

    await expect(checkpoints.requestCheckpoint(1)).resolves.toBeUndefined();

    expect(store.getState().livingSaves).toMatchObject({
      saveHealth: 'save-unavailable',
      failureReason: 'unavailable-storage',
    });
  });
});
