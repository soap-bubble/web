import inputObservables from './inputKeyHandlers';
import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
  KEY_DOWN,
  KEY_UP,
  CURSOR_SET_POS,
} from './actionTypes';

export function inputHandler({
  key,
  keys,
  down,
  up,
}: {
  key?: string
  keys?: string[],
  down?: (a: any, b: any) => any,
  up?: (a: any, b: any) => any
}) {
  function addKey(k: string, h: { up?: (a: any, b: any) => any; down?: (a: any, b: any) => any}) {
    if (!inputObservables[k]) {
      inputObservables[k] = [] as { up?: (a: any, b: any) => any; down?: (a: any, b: any) => any}[];
    }
    inputObservables[k].push(h);
  }
  if (key) {
    addKey(key, {
      down,
      up,
    });
  }
  if (keys) {
    keys.forEach(k => addKey(k, {
      down,
      up,
    }));
  }
}

export function keyDown(keyCode: string) {
  return {
    type: KEY_DOWN,
    payload: keyCode,
  };
}

export function keyUp(keyCode: string) {
  return {
    type: KEY_UP,
    payload: keyCode,
  };
}

export function disableControl() {
  return {
    type: DISABLE_CONTROL,
  };
}

export function enableControl() {
  return {
    type: ENABLE_CONTROL,
  };
}

export function cursorSetPosition({
  top,
  left,
}: { top: number; left: number}) {
  return {
    type: CURSOR_SET_POS,
    payload: {
      top,
      left,
    },
    logging: false,
  };
}
