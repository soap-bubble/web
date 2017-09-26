import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
  KEY_INPUT,
} from './actionTypes';

export function keyPress(keyCode) {
  return {
    type: KEY_INPUT,
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
