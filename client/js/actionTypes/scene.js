import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE
} from './types';

export function canvasCreated(canvas) {
  return {
    type: SCENE_CANVAS_CREATED,
    payload: { canvas }
  };
}

export function sceneLoad(id) {
  return {
    type:SCENE_LOAD_START,
    meta: { id }
  }
}

export function sceneLoadComplete(responseData) {
  return {
    type: SCENE_LOAD_COMPLETE,
    payload: responseData
  };
}
