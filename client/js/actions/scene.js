import { bySceneId } from '../service/scene';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
} from './types';

export function sceneLoadComplete(responseData) {
  return {
    type: SCENE_LOAD_COMPLETE,
    payload: responseData,
  };
}

export function sceneLoad(id) {
  return {
    type: SCENE_LOAD_START,
    payload: id,
  };
}

export function fetchScene(id) {
  return (dispatch) => {
    dispatch(sceneLoad(id));
    return bySceneId(id)
      .then(response => response.data)
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
  };
}
