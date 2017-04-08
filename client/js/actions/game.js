import {
  load as loadPano,
} from './pano';
import {
  load as loadSpecial,
} from './special';
import {
  display as displayTransition,
} from './transition';
import {
  getSceneType,
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
      special: loadSpecial,
      transition: displayTransition,
    }
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
