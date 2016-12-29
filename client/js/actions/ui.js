import {
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
} from './types';

export function addMouseUp(callback) {
  return {
    type: UI_ADD_ONMOUSEUP,
    payload: callback,
  };
}

export function addMouseMove(callback) {
  return {
    type: UI_ADD_ONMOUSEMOVE,
    payload: callback,
  };
}

export function addMouseDown(callback) {
  return {
    type: UI_ADD_ONMOUSEDOWN,
    payload: callback,
  };
}
