import {
  load as loadPano,
} from './pano';
import {
  display as displayTransition,
} from './transition';
import {
  SCENE_TYPE_LIST,
} from '../morpheus/scene';
import {
  GAME_SCENE_LOADING,
  GAME_SET_VOLUME,
} from './types';

export function setVolume(volume) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  };
}

export function display() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { loaded, cache } = scene;
    const sceneData = cache[loaded];
    const sceneActionMap = {
      panorama: loadPano,
      special: displayTransition,
      transition: displayTransition,
    }
    const sceneType = SCENE_TYPE_LIST[sceneData.sceneType];
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
