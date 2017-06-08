import {
  actions as panoActions,
} from 'morpheus/pano';
import {
  getSceneType,
  actions as sceneActions,
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
  GAME_SET_CURSOR,
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

export function setCursor(cursor) {
  return {
    type: GAME_SET_CURSOR,
    payload: cursor,
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
    setSize(getState().hotspot);
  };
}

export function display() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { currentScene: sceneData } = scene;
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
      dispatch(sceneActionFunction(sceneData))
        .then(() => dispatch(sceneActions.doEnter()));
    }
  };
}
