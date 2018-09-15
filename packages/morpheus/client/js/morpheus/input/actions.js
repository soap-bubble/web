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
}) {
  function addKey(k, h) {
    if (!inputObservables[k]) {
      inputObservables[k] = [];
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

export function keyDown(keyCode) {
  return {
    type: KEY_DOWN,
    payload: keyCode,
  };
}

export function keyUp(keyCode) {
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
}) {
  console.log(left, top);
  return {
    type: CURSOR_SET_POS,
    payload: {
      top,
      left,
    },
    logging: false,
  };
}
