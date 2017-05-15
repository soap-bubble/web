import {
  defer,
} from 'lodash';

import {
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_SET_CURRENT_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_DO_ACTION,
} from './actionTypes';

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

export function doEntering(scene) {
  defer(() => {
    scene.casts
      .filter(cast => cast.isEntering()
        && cast.isEnabled())
      .forEach(cast => cast.doEntering());
  });
  return {
    type: SCENE_DO_ENTERING,
    payload: scene,
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
