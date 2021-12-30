export type IState = {
  enabled: boolean;
  interactionDebounce: number;
  sensitivity: number;
  pressedKeys: { [key: string]: boolean };
  cursorScreenPos: { top?: number; left?: number };
};
