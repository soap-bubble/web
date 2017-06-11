import {
  defer,
} from 'lodash';

import { bySceneId } from 'service/scene';
import {
  actions as gameActions,
} from 'morpheus/game';
// import {
//   actions as hotspotActions,
// } from 'morpheus/hotspot';

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

export function setCurrentScene(scene) {
  return {
    type: SCENE_SET_CURRENT_SCENE,
    payload: scene,
  };
}

export function doEntering() {
  return {
    type: SCENE_DO_ENTERING,
  };
}

function doEnterForCast(type, doEnterAction, scene) {
  return dispatch => dispatch(doEnterAction(scene))
    .then(castState => dispatch({
      type: CAST_DO_ENTER,
      payload: castState,
      meta: type,
    }));
}

export function doEnter(scene) {
  return (dispatch) => {
    // dispatch({
    //   type: SCENE_DO_ENTER,
    // });

    return Promise.all([
      dispatch(doEnterForCast('pano', panoActions.doEnter, scene)),
      dispatch(doEnterForCast('panoAnim', panoAnimActions.doEnter, scene)),
      dispatch(doEnterForCast('hotspot', hotspotActions.doEnter, scene)),
    ]);
  };
}

export function doExiting(scene) {
  defer(() => {
    scene.casts
      .filter(cast => cast.isExiting()
        && cast.isEnabled())
      .forEach(cast => cast.doEntering());
  });
  return {
    type: SCENE_DO_EXITING,
    payload: scene,
  };
}

export function doOnStageAction(scene) {
  defer(() => {
    scene.casts
    .filter(cast => (cast.isEntering()
      || cast.isOnStage())
      && cast.isEnabled())
    .forEach(cast => cast.doAction());
  });
  return {
    type: SCENE_DO_ACTION,
    payload: scene,
  };
}

function onStageForCast(type, onStageAction) {
  return (dispatch) => {
    const promise = dispatch(onStageAction());
    if (!(promise && promise.then)) {
      throw new Error(`${type} onStage failed to return a promise`);
    }
    return promise
      .then(castState => dispatch({
        type: CAST_ON_STAGE,
        payload: castState,
        meta: type,
      }));
  };
}

function onStage() {
  return (dispatch) => {
    dispatch({
      type: SCENE_DO_ENTER,
    });

    return Promise.all([
      dispatch(onStageForCast('pano', panoActions.onStage)),
      dispatch(onStageForCast('panoAnim', panoAnimActions.onStage)),
      dispatch(onStageForCast('hotspot', hotspotActions.onStage)),
    ]);
  };
}

export function goToScene(id) {
  return dispatch => dispatch(fetchScene(id))
    .then(scene => dispatch(castActions.doEnter(scene)))
    .then((scene) => {
      dispatch({
        type: SCENE_DO_ENTERING,
      });
      dispatch({
        type: SCENE_DO_ENTER,
      });
      return scene;
    })
    .then(scene => dispatch(castActions.onStage(scene)))
    .then((scene) => {
      dispatch(gameActions.resize({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
      return scene;
    })
;
}
