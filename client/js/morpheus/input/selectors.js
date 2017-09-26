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

export const pressedKey = createSelector(
  input,
  i => i.keyInput,
);
