import { describe, expect, it } from 'vitest';

import { createAppStore } from '@/morpheus-app/store/store';
import {
  selectGamestatesAccessor,
  updateGamestate,
} from '@/morpheus-app/store/slices/gamestateSlice';
import { createHotspot } from '@/morpheus-app/hotspot/harnessClick.fixtures';
import {
  createLiveGamestatesReader,
  finishPointerInteraction,
  isDirectPointerActionHotspot,
  isPointerDragHotspot,
  resolvePointerSuppression,
} from './useInputHandler';

describe('input lifecycle across scene transitions', () => {
  it('ends a held pointer gesture before the incoming scene can process it', () => {
    expect(
      finishPointerInteraction({
        screenX: 200,
        screenY: 300,
        isDown: true,
        downTime: 123,
        startScreenX: 200,
        startScreenY: 100,
        startGameX: 80,
        startGameY: 40,
      }),
    ).toEqual({
      screenX: 200,
      screenY: 300,
      isDown: false,
      downTime: 123,
      startScreenX: 0,
      startScreenY: 0,
      startGameX: 0,
      startGameY: 0,
    });
  });

  it('ignores the old pointer stream until release after a scene transition', () => {
    expect(resolvePointerSuppression(17, 17, 'move')).toEqual({
      shouldIgnore: true,
      suppressedPointerId: 17,
    });
    expect(resolvePointerSuppression(17, 17, 'up')).toEqual({
      shouldIgnore: true,
      suppressedPointerId: null,
    });
    expect(resolvePointerSuppression(17, 17, 'down')).toEqual({
      shouldIgnore: false,
      suppressedPointerId: null,
    });
    expect(resolvePointerSuppression(null, 17, 'down')).toEqual({
      shouldIgnore: false,
      suppressedPointerId: null,
    });
  });

  it('does not let a second pointer reactivate the suppressed stream', () => {
    expect(resolvePointerSuppression(17, 18, 'down')).toEqual({
      shouldIgnore: true,
      suppressedPointerId: 17,
    });
    expect(resolvePointerSuppression(17, 18, 'move')).toEqual({
      shouldIgnore: true,
      suppressedPointerId: 17,
    });
    expect(resolvePointerSuppression(17, 17, 'cancel')).toEqual({
      shouldIgnore: true,
      suppressedPointerId: null,
    });
  });

  it('reads Redux writes synchronously across chained scene-entry rules', () => {
    const store = createAppStore();
    const renderedGamestates = selectGamestatesAccessor(store.getState());
    const readLiveGamestates = createLiveGamestatesReader(store.getState);

    store.dispatch(updateGamestate({ stateId: 1011, value: 5 }));

    expect(renderedGamestates.byId(1011).value).toBe(0);
    expect(readLiveGamestates().byId(1011).value).toBe(5);

    store.dispatch(updateGamestate({ stateId: 1011, value: 0 }));

    expect(readLiveGamestates().byId(1011).value).toBe(0);
  });

  it('lets sliders drag regardless of their authored gesture', () => {
    for (const type of [6, 7, 8]) {
      expect(
        isPointerDragHotspot(createHotspot({ type, gesture: 3 })),
      ).toBe(true);
    }
    expect(
      isPointerDragHotspot(createHotspot({ type: 5, gesture: 3 })),
    ).toBe(false);
  });

  it('does not execute continuous controls as direct hover actions', () => {
    for (const type of [5, 6, 7, 8]) {
      expect(
        isDirectPointerActionHotspot(createHotspot({ type, gesture: 3 })),
      ).toBe(false);
    }
    expect(
      isDirectPointerActionHotspot(createHotspot({ type: 2, gesture: 3 })),
    ).toBe(true);
  });
});
