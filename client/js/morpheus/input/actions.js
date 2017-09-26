import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
} from './actionTypes';

export function keyPress(keyCode) {

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
