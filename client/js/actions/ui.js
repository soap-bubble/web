import {
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
  UI_ADD_ONTOUCHSTART,
  UI_ADD_ONTOUCHMOVE,
  UI_ADD_ONTOUCHEND,
  UI_ADD_ONTOUCHCANCEL,
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

export function addTouchStart(callback) {
  return {
    type: UI_ADD_ONTOUCHSTART,
    payload: callback,
  };
}

export function addTouchMove(callback) {
  return {
    type: UI_ADD_ONTOUCHMOVE,
    payload: callback,
  };
}

export function addTouchEnd(callback) {
  return {
    type: UI_ADD_ONTOUCHEND,
    payload: callback,
  };
}

export function addTouchCancel(callback) {
  return {
    type: UI_ADD_ONTOUCHCANCEL,
    payload: callback,
  };
}
