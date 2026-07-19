import { describe, expect, it } from 'vitest';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Scene } from 'morpheus/casts/types';

import { installLivingSaveRuntime } from './actions';
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

describe('installLivingSaveRuntime', () => {
  it('replaces gamestate, active/return scene context, and rotation together', () => {
    const store = createAppStore();
    const initialGamestates = fetchInitial();
    const values = Object.fromEntries(
      initialGamestates.map((gamestate) => [
        gamestate.stateId,
        gamestate.value,
      ]),
    );
    const first = initialGamestates[0];
    values[first.stateId] = Math.min(first.maxValue, first.value + 1);
    const envelope = createLivingSaveEnvelopeFixture({
      gamestateValues: values,
      activeSceneId: 2000,
      returnSceneId: 1050,
      rotation: { yaw3600: 2200, pitch: 35 },
    });
    const catalog = occupyLivingSaveSlot(
      createEmptyLivingSaveCatalogFixture(),
      'slot-1',
      envelope,
    );

    store.dispatch(
      installLivingSaveRuntime({
        operationId: 'restore-1',
        catalog,
        slotId: 'slot-1',
        envelope,
        activeScene: scene(2000),
        returnScene: scene(1050),
        saveHealth: 'saved',
      }),
    );

    const state = store.getState();
    expect(state.gamestate.byId[first.stateId].value).toBe(
      values[first.stateId],
    );
    expect(state.scene.activeSceneId).toBe(2000);
    expect(state.scene.returnSceneId).toBe(1050);
    expect(state.scene.stack.map((entry) => entry.sceneId)).toEqual([
      2000, 1050,
    ]);
    expect(state.rotation.current).toEqual({ yaw3600: 2200, pitch: 35 });
    expect(state.livingSaves.runtimeGeneration).toBe(1);
    expect(state.livingSaves.activeSlotId).toBe('slot-1');
  });
});
