import { bySceneId } from '../service/scene';
import {
  display,
} from './game';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_DISPLAY_PANORAMA,
  SCENE_DISPLAY_TRANSITION,
} from './types';
import {
  SCENE_TYPE_LIST,
} from '../morpheus/scene';


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
  return (dispatch, getState) => {
    const { video } = getState();
    const { loading, loaded } = video;

    function doIt(sceneData) {
      dispatch(display());
    }

    let promise;
    if (loading[id]) {
      promise = loading[id].then(doIt);
    } else if (loaded[id]){
      promise = loaded[id].then(doIt);
    } else {
      promise = dispatch(fetchScene(id))
        .then(doIt);
    }
    return promise;
  };
}
