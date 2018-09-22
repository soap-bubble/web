import { createSelector } from 'reselect';

export const input = state => state.input;

export const enabled = createSelector(
  input,
  i => i.enabled,
);
export const disabled = createSelector(
  input,
  i => !i.enabled,
);

export const interactionDebounce = createSelector(
  input,
  i => i.interactionDebounce,
);

export const sensitivity = createSelector(
  input,
  i => i.sensitivity,
);

export const pressedKeys = createSelector(
  input,
  i => i.pressedKeys,
);

export function isKeyPressed(key) {
  return createSelector(
    pressedKeys,
    keys => !!keys[key],
  );
}

export const cursorPosition = createSelector(
  input,
  i => i.cursorScreenPos,
);

export const inputHandler = (delegate) => {
  let isTouch = false;
  return {
    onMouseUp(event) {
      if (!isTouch) {
        delegate.onMouseUp(event);
      }
    },
    onMouseMove(event) {
      if (!isTouch) {
        delegate.onMouseMove(event);
      }
    },
    onMouseDown(event) {
      if (!isTouch) {
        delegate.onMouseDown(event);
      }
    },
    onTouchStart(event) {
      isTouch = true;
      delegate.onTouchStart(event);
    },
    onTouchMove(event) {
      isTouch = true;
      delegate.onTouchMove(event);
    },
    onTouchEnd(event) {
      isTouch = true;
      delegate.onTouchEnd(event);
    },
    onTouchCancel(event) {
      delegate.onTouchCancel(event);
    },
  };
};
