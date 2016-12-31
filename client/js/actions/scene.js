import { bySceneId } from '../service/scene';
import {
  resize
} from './dimensions';
import {
  createPano,
  startRenderLoop as startPanoRenderLoop,
  positionCamera,
} from './pano';
import {
  hotspotsLoaded,
} from './hotspots';
import {
  playFullscreenVideo,
} from './video';
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
      dispatch(display(sceneData));
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

export function displayPanorama(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const hotspotsData = casts.filter(c => c.castId === 0);

    dispatch(hotspotsLoaded(hotspotsData));
    dispatch(createPano(sceneData));
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(positionCamera({ z: -0.4 }));
    dispatch(startPanoRenderLoop());
  };
}

export function displayTransition(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
    const fileName = `/${transitionCast.fileName}.webm`;
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(playFullscreenVideo(fileName));
  };
}

export function display(sceneData) {
  return (dispatch) => {
    const sceneActionMap = {
      panorama: displayPanorama,
      special: displayTransition,
      transition: displayTransition,
    }
    const sceneType = SCENE_TYPE_LIST[sceneData.sceneType];
    const sceneActionFunction = sceneActionMap[sceneType];
    if (sceneActionFunction) {
      dispatch(sceneActionFunction(sceneData));
    }
  };
}
