import {
  actions as panoActions,
} from 'morpheus/pano';
import {
  getSceneType,
} from 'morpheus/scene';
import {
  actions as specialActions,
} from 'morpheus/special';
import {
  actions as transitionActions,
} from 'morpheus/transition';
import {
  DIMENSIONS_RESIZE,
  GAME_SCENE_LOADING,
  GAME_SET_VOLUME,
  ADD_ONMOUSEUP,
  ADD_ONMOUSEMOVE,
  ADD_ONMOUSEDOWN,
  ADD_ONTOUCHSTART,
  ADD_ONTOUCHMOVE,
  ADD_ONTOUCHEND,
  ADD_ONTOUCHCANCEL,
} from './actionTypes';

export function setVolume(volume) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  };
}

export function resize({ width, height }) {
  function setSize({ camera, renderer}) {
    if (camera && renderer) {
      renderer.setSize(width, height);
      camera.aspect	= width / height;
      camera.updateProjectionMatrix();
    }
  }
  return (dispatch, getState) => {
    dispatch({
      type: DIMENSIONS_RESIZE,
      payload: {
        width,
        height,
      },
    });
    setSize(getState().pano);
    setSize(getState().hotspots);
  };
}

export function addMouseUp(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEUP,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addMouseMove(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEMOVE,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addMouseDown(callback, sceneOnly = true) {
  return {
    type: ADD_ONMOUSEDOWN,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchStart(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHSTART,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchMove(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHMOVE,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchEnd(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHEND,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function addTouchCancel(callback, sceneOnly = true) {
  return {
    type: ADD_ONTOUCHCANCEL,
    payload: callback,
    meta: { sceneOnly }
  };
}

export function display() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { loaded, cache } = scene;
    const sceneData = cache[loaded];
    const sceneActionMap = {
      panorama: panoActions.load,
      special: specialActions.load,
      transition: transitionActions.display,
    };
    const sceneType = getSceneType(sceneData);
    const sceneActionFunction = sceneActionMap[sceneType];
    if (sceneActionFunction) {
      dispatch({
        type: GAME_SCENE_LOADING,
        payload: sceneData,
      });
      dispatch(sceneActionFunction(sceneData));
    }
  };
}
