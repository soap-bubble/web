import {
  ADD_ONMOUSEUP,
  ADD_ONMOUSEMOVE,
  ADD_ONMOUSEDOWN,
  ADD_ONTOUCHSTART,
  ADD_ONTOUCHMOVE,
  ADD_ONTOUCHEND,
  ADD_ONTOUCHCANCEL,
  DISABLE_CONTROL,
} from './actionTypes';

export function disableControl() {
  return {
    type: DISABLE_CONTROL,
  };
}

export function addMouseUp(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEUP,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addMouseMove(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEMOVE,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addMouseDown(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEDOWN,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addTouchStart(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHSTART,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addTouchMove(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHMOVE,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addTouchEnd(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHEND,
    payload: callback,
    meta: { sceneOnly },
  };
}

export function addTouchCancel(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHCANCEL,
    payload: callback,
    meta: { sceneOnly },
  };
}
