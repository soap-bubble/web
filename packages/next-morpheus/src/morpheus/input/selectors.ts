import { createSelector } from "reselect";
import { IState } from "./types";

export const input = (state: { input: IState }) => state.input;

export const enabled = createSelector(input, (i) => i.enabled);
export const disabled = createSelector(input, (i) => !i.enabled);

export const interactionDebounce = createSelector(
  input,
  (i) => i.interactionDebounce
);

export const sensitivity = createSelector(input, (i) => i.sensitivity);

export const pressedKeys = createSelector(input, (i) => i.pressedKeys);

export function isKeyPressed(key: string) {
  return createSelector(pressedKeys, (keys) => !!keys[key]);
}

export const cursorPosition = createSelector(input, (i) => i.cursorScreenPos);
