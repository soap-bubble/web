import { createSelector } from 'reselect';

export const input = (state: any) => state.input;

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

export function isKeyPressed(key: string) {
  return createSelector(
    pressedKeys,
    keys => !!keys[key],
  );
}

export const cursorPosition = createSelector(
  input,
  i => i.cursorScreenPos,
);
