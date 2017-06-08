import {
  ENTERING,
  EXITING,
  ENTER,
  EXIT,
} from './actionTypes';

export function doEnter(scene) {
  return {
    type: ENTER,
    payload: scene,
  };
}

export function doEntering(scene) {
  return {
    type: ENTERING,
  };
}

export function doExit() {
  return {
    type: EXIT,
  };
}

export function doExiting() {
  return {
    type: EXITING,
  };
}
