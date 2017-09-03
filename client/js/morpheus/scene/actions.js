import { reset } from 'utils/render';
import { bySceneId } from 'service/scene';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  actions as inputActions,
} from 'morpheus/input';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';

import {
  SCENE_LOAD_START,
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_SET_CURRENT_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_ENTER,
  SCENE_DO_EXITING,
  SET_NEXT_START_ANGLE,
} from './actionTypes';


export function sceneLoadComplete(responseData) {
  return (dispatch) => {
    dispatch({
      type: SCENE_SET_CURRENT_SCENE,
      payload: responseData,
    });
  };
}

export function sceneLoadStarted(id, fetchPromise) {
  return {
    type: SCENE_LOAD_START,
    payload: id,
    meta: fetchPromise,
  };
}

export function fetch(id) {
  return (dispatch, getState) => {
    const loadedScenes = sceneSelectors.loadedScenes(getState());
    const cachedScene = loadedScenes.find(scene => scene.sceneId === id);
    if (cachedScene) {
      return Promise.resolve(cachedScene);
    }
    const fetchPromise = bySceneId(id)
      .then(response => response.data)
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
    dispatch(sceneLoadStarted(id, fetchPromise));
    return fetchPromise;
  };
}

export function fetchScene(id) {
  return fetch(id);
}

export function setBackgroundScene(scene) {
  return {
    type: SCENE_SET_BACKGROUND_SCENE,
    payload: scene,
  };
}

export function setNextStartAngle(angle) {
  return {
    type: SET_NEXT_START_ANGLE,
    payload: angle,
  };
}

export function startAtScene(id) {
  return dispatch => dispatch(fetchScene(id))
      .then(scene => dispatch(castActions.lifecycle.doLoad(scene))
          .then(() => dispatch(castActions.lifecycle.doEnter(scene)))
          .then(() => dispatch({
            type: SCENE_DO_ENTERING,
            payload: scene,
          }))
          .then(() => dispatch(castActions.lifecycle.onStage(scene)))
          .then(() => {
            dispatch(gameActions.resize({
              width: window.innerWidth,
              height: window.innerHeight,
            }));
            dispatch({
              type: SCENE_DO_ENTER,
              payload: scene.sceneId,
            });
            dispatch(inputActions.enableControl());
            return scene;
          }));
}

export function goToScene(id, dissolve) {
  return (dispatch, getState) => {
    const currentSceneData = sceneSelectors.currentSceneData(getState());
    if (currentSceneData && currentSceneData.sceneId === id) {
      return Promise.resolve(currentSceneData);
    }
    return dispatch(castActions.lifecycle.doExit(currentSceneData))
      .then(() => {
        dispatch({
          type: SCENE_DO_EXITING,
          payload: {
            sceneId: currentSceneData && currentSceneData.sceneId,
            dissolve,
          },
        });
        dispatch(inputActions.disableControl());
        reset();
        return dispatch(startAtScene(id));
      });
  };
}
