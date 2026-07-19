import { describe, expect, it } from 'vitest';

import { resetGame } from './actions';
import { store } from './store';
import { updateGamestate } from './slices/gamestateSlice';
import { setRotation } from './slices/rotationSlice';
import { requestScene } from './slices/sceneSlice';

describe('resetGame', () => {
  it('restores all live Redux gameplay state', () => {
    const initialGamestate = Object.values(store.getState().gamestate.byId)[0];
    expect(initialGamestate).toBeDefined();

    store.dispatch(
      updateGamestate({
        stateId: initialGamestate.stateId,
        value: initialGamestate.value + 1,
      }),
    );
    store.dispatch(requestScene(1050));
    store.dispatch(setRotation({ yaw3600: 1200, pitch: 25 }));

    store.dispatch(resetGame());

    const state = store.getState();
    expect(state.gamestate.byId[initialGamestate.stateId].value).toBe(
      initialGamestate.value,
    );
    expect(state.scene).toMatchObject({
      activeSceneId: null,
      returnSceneId: null,
      requestedSceneId: null,
      stack: [],
    });
    expect(state.rotation).toEqual({
      current: { yaw3600: 0, pitch: 0 },
      seededFromTransition: false,
    });
    expect(state.livingSaves.bootstrapPhase).toBe('idle');
  });
});
