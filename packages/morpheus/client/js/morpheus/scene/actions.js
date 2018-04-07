import { reset } from 'utils/render';
import Events from 'events';
import { bySceneId } from 'service/scene';
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

export const events = new Events();

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
            dispatch({
              type: SCENE_DO_ENTER,
              payload: scene.sceneId,
            });

            dispatch(inputActions.enableControl());
            events.emit(`sceneEnter:${id}`);
            return scene;
          }));
}

let isTransitioning = false;
export function goToScene(id, dissolve) {
  return (dispatch, getState) => {
    const currentSceneData = sceneSelectors.currentSceneData(getState());

    function doSceneTransition() {
      isTransitioning = true;
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
          return dispatch(startAtScene(id))
            .then((scene) => {
              isTransitioning = false;
              return scene;
            });
        });
    }

    if (isTransitioning || (currentSceneData && currentSceneData.sceneId === id)) {
      return Promise.resolve(currentSceneData);
    }
    return doSceneTransition();
  };
}
