import {
  ENTERING,
  EXITING,
  ON_STAGE,
  ENTER,
  EXIT,
} from './actionTypes';

import {
  delegates,
} from './index';

function doEnterForCast(type, doEnterAction) {
  return dispatch => dispatch(doEnterAction())
    .then(castState => dispatch({
      type: ENTERING,
      payload: castState,
      meta: type,
    }));
}

export function doEnter() {
  return (dispatch, getState) => {
    dispatch({
      type: ENTER,
    });
    return Promise.all(Object.keys(delegates).map((cast) => {
      const delegate = delegates[cast];
      if (delegate.doEnter && delegate.applies(getState())) {
        return dispatch(doEnterForCast(cast, delegate.doEnter));
      }
      return Promise.resolve();
    }));
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
        type: ON_STAGE,
        payload: castState,
        meta: type,
      }));
  };
}

export function onStage() {
  return (dispatch, getState) => Promise.all(Object.keys(delegates).map((cast) => {
    const delegate = delegates[cast];
    if (delegate.onStage && delegate.applies(getState())) {
      return dispatch(onStageForCast(cast, delegate.onStage));
    }
    return Promise.resolve();
  }));
}

function doExitForCast(type, doExitAction) {
  return dispatch => dispatch(doExitAction())
    .then(castState => dispatch({
      type: EXIT,
      payload: castState,
      meta: type,
    }));
}

export function doExit() {
  return (dispatch, getState) => {
    dispatch({
      type: ENTER,
    });
    return Promise.all(Object.keys(delegates).map((cast) => {
      const delegate = delegates[cast];
      if (delegate.doExit && delegate.applies(getState())) {
        return dispatch(doExitForCast(cast, delegate.doExit));
      }
      return Promise.resolve();
    }));
  };
}

export { actions as pano } from './pano';
export { actions as panoAnim } from './panoAnim';
export { actions as hotspot } from './hotspot';
export { actions as transition } from './transition';
export { actions as special } from './special';
