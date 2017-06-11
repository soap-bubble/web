import {
  ENTERING,
  EXITING,
  ON_STAGE,
  ENTER,
  EXIT,
} from './actionTypes';

import * as Pano from './pano';
import * as Hotspot from './hotspot'
import * as PanoAnim from './panoAnim';

function doEnterForCast(type, doEnterAction, scene) {
  return dispatch => dispatch(doEnterAction(scene))
    .then(castState => dispatch({
      type: ENTERING,
      payload: castState,
      meta: type,
    }));
}

export function doEnter(scene) {
  return (dispatch) => {
    dispatch({
      type: ENTER,
      payload: scene,
    });
    return Promise.all([
      dispatch(doEnterForCast('pano', Pano.actions.doEnter, scene)),
      dispatch(doEnterForCast('panoAnim', PanoAnim.actions.doEnter, scene)),
      dispatch(doEnterForCast('hotspot', Hotspot.actions.doEnter, scene)),
    ]);
    // return Promise.all(castTypes.reduce((promises, type) => {
    //   const casts = type.selectors.casts(scene);
    //   return promises.concat(casts.map(cast => type.actions.doEnter(cast)));
    // }, []))
    //   .then(() => dispatch({
    //     type: ENTER,
    //     payload: scene,
    //   }));
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
  return dispatch => Promise.all([
    dispatch(onStageForCast('pano', Pano.actions.onStage)),
    dispatch(onStageForCast('panoAnim', PanoAnim.actions.onStage)),
    dispatch(onStageForCast('hotspot', Hotspot.actions.onStage)),
  ]);
}

export function doExit() {
  return {
    type: EXIT,
  };
}

export function doExiting() {
  return {
    type: EXITING,
  };
}

export { actions as pano } from './pano';
export { actions as panoAnim } from './panoAnim';
export { actions as hotspot } from './hotspot';
