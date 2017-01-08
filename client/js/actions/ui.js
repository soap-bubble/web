import {
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
  UI_ADD_ONTOUCHSTART,
  UI_ADD_ONTOUCHMOVE,
  UI_ADD_ONTOUCHEND,
  UI_ADD_ONTOUCHCANCEL,
} from './types';

export function addMouseUp(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONMOUSEUP,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addMouseMove(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONMOUSEMOVE,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addMouseDown(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONMOUSEDOWN,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchStart(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONTOUCHSTART,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchMove(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONTOUCHMOVE,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchEnd(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONTOUCHEND,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchCancel(callback, sceneOnly = true) {
  return {
    type: UI_ADD_ONTOUCHCANCEL,
    payload: callback,
    meta: { sceneOnly }
  };
}
