import { describe, expect, it } from 'vitest';

import {
  finishPointerInteraction,
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
});
