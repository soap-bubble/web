import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ENTER,
  EXIT,
} from './actionTypes';
import createLogger from 'utils/logger';
import {
  delegates,
} from './index';

const logger = createLogger('casts:actions');

export function doLoad(scene) {
  return {
    type: LOADING,
    payload: scene,
  };
}

function doEnterForCast(scene, type, doEnterAction) {
  return dispatch => dispatch(doEnterAction(scene))
    .then(castState => dispatch({
      type: ENTERING,
      payload: castState,
      meta: { type, scene },
    }));
}

export function doEnter(scene) {
  return (dispatch, getState) => {
    dispatch({
      type: ENTER,
      payload: scene,
    });
    return Promise.all(Object.keys(delegates).map((cast) => {
      const delegate = delegates[cast];
      if (delegate.doEnter && delegate.applies(scene, getState())) {
        return dispatch(doEnterForCast(scene, cast, delegate.doEnter));
      }
      return Promise.resolve();
    }))
      .then(() => scene);
  };
}

function onStageForCast(scene, type, onStageAction) {
  return (dispatch) => {
    const promise = dispatch(onStageAction(scene));
    if (!(promise && promise.then)) {
      throw new Error(`${type} onStage failed to return a promise`);
    }
    return promise
      .then(castState => dispatch({
        type: ON_STAGE,
        payload: castState,
        meta: { type, scene },
      }))
      .then(() => scene);
  };
}

export function onStage(scene) {
  return (dispatch, getState) => Promise.all(Object.keys(delegates).map((cast) => {
    const delegate = delegates[cast];
    if (delegate.onStage && delegate.applies(scene, getState())) {
      return dispatch(onStageForCast(scene, cast, delegate.onStage));
    }
    return Promise.resolve();
  }))
    .then(() => scene);
}

function doExitForCast(scene, type, doExitAction) {
  return dispatch => dispatch(doExitAction(scene))
    .then(castState => dispatch({
      type: EXIT,
      payload: castState,
      meta: { type, scene },
    }));
}

export function doExit(scene) {
  return (dispatch, getState) => {
    return Promise.all(Object.keys(delegates).map((cast) => {
      const delegate = delegates[cast];
      if (delegate.doExit && delegate.applies(scene, getState())) {
        return dispatch(doExitForCast(scene, cast, delegate.doExit));
      }
      return Promise.resolve();
    }))
      .then(() => scene);
  };
}

export { actions as pano } from './pano';
export { actions as panoAnim } from './panoAnim';
export { actions as hotspot } from './hotspot';
export { actions as transition } from './transition';
export { actions as special } from './special';
