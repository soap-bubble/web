import {
  defer,
} from 'lodash';

import renderEvents from 'utils/render';
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
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_SET_CURRENT_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_ENTER,
  SCENE_DO_EXITING,
  SCENE_DO_ACTION,
  SET_NEXT_START_ANGLE,
} from './actionTypes';


const sceneCache = {};

export function sceneLoadComplete(responseData) {
  return (dispatch) => {
    dispatch({
      type: SCENE_SET_CURRENT_SCENE,
      payload: responseData,
    });
    // dispatch(hotspotActions.hotspotsLoaded(responseData));
  };
}

export function sceneLoadStarted(id, fetch) {
  return {
    type: SCENE_LOAD_START,
    payload: id,
    meta: fetch,
  };
}

export function fetch(id) {
  return (dispatch) => {
    if (sceneCache[id]) {
      return sceneCache[id];
    }
    const fetchPromise = bySceneId(id)
      .then(response => response.data)
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
    dispatch(sceneLoadStarted(id, fetch));
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

export function doEntering() {
  return {
    type: SCENE_DO_ENTERING,
  };
}

export function setNextStartAngle(angle) {
  return {
    type: SET_NEXT_START_ANGLE,
    payload: angle,
  };
}

export function startAtScene(id) {
  return (dispatch) => {
    return dispatch(fetchScene(id))
      .then(scene => {
        dispatch(castActions.doEnter(scene))
          .then(() => dispatch({
            type: SCENE_DO_ENTERING,
            payload: scene,
          }))
          .then(() => dispatch(castActions.onStage(scene)))
          .then(() => {
            dispatch(gameActions.resize({
              width: window.innerWidth,
              height: window.innerHeight,
            }));
            dispatch({
              type: SCENE_DO_ENTER,
            });
            return scene;
          });
      });
  }
}

export function goToScene(id) {
  return dispatch => {
    dispatch(castActions.doExit());
    dispatch({
      type: SCENE_DO_EXITING,
    });
    dispatch(inputActions.disableControl());
    renderEvents.reset();
    return dispatch(startAtScene(id));
  };
}
