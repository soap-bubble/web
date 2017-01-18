import { bySceneId } from '../service/scene';
import {
  display,
} from './game';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
} from './types';

const sceneCache = {};

export function sceneLoadComplete(responseData) {
  return {
    type: SCENE_LOAD_COMPLETE,
    payload: responseData,
  };
}

export function sceneLoadStarted(id, fetch) {
  return {
    type: SCENE_LOAD_START,
    payload: id,
    meta: fetch,
  };
}

export function fetchScene(id) {
  return (dispatch) => {
    if (!id) {
      debugger;
    }
    if (sceneCache[id]) {
      return sceneCache[id];
    }
    const fetch = bySceneId(id)
      .then(response => response.data)
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
    dispatch(sceneLoadStarted(id, fetch));
    return fetch;
  };
}

export function goToScene(id) {
  return (dispatch) => {
    function doIt() {
      dispatch(display());
    }

    return dispatch(fetchScene(id))
      .then(doIt);
  };
}
