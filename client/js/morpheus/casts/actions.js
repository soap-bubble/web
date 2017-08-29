import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ENTER,
  EXIT,
} from './actionTypes';
import {
  memoize,
} from 'lodash';
import createLogger from 'utils/logger';
import * as modules from './modules';

const logger = createLogger('casts:actions');

export function doLoad(scene) {
  return (dispatch) => {
    dispatch({
      type: LOADING,
      payload: scene,
    });
    return Promise.resolve();
  };
}

function doEnterForCast(scene, type, doEnterAction) {
  return dispatch => dispatch(doEnterAction())
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
    return Promise.all(Object.keys(modules).map((cast) => {
      const module = modules[cast];
      const delegate = module.delegate && module.delegate(scene);
      if (delegate && delegate && delegate.doEnter && delegate.applies(getState())) {
        return dispatch(doEnterForCast(scene, cast, delegate.doEnter));
      }
      return Promise.resolve();
    }))
      .then(() => scene);
  };
}

function onStageForCast(scene, type, onStageAction) {
  return (dispatch) => {
    const promise = dispatch(onStageAction());
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
  return (dispatch, getState) => Promise.all(Object.keys(modules).map((cast) => {
    const module = modules[cast];
    const delegate = module.delegate && module.delegate(scene);
    if (delegate && delegate.onStage && delegate.applies(getState())) {
      return dispatch(onStageForCast(scene, cast, delegate.onStage));
    }
    return Promise.resolve();
  }))
      .then(() => scene);
}

function doExitForCast(scene, type, doExitAction) {
  return dispatch => dispatch(doExitAction())
    .then(castState => dispatch({
      type: EXIT,
      payload: castState,
      meta: { type, scene },
    }));
}

export function doExit(scene) {
  return (dispatch, getState) => Promise.all(Object.keys(modules).map((cast) => {
    const module = modules[cast];
    const delegate = module.delegate && module.delegate(scene);
    if (delegate && delegate.doExit && delegate.applies(getState())) {
      return dispatch(doExitForCast(scene, cast, delegate.doExit));
    }
    return Promise.resolve();
  }))
      .then(() => scene);
}

export const forScene = memoize((scene) => {
  const moduleActions = Object.keys(modules).reduce((memo, name) => {
    if (modules[name].actions) {
      memo[name] = modules[name].actions;
    }
    return memo;
  }, {});
  return Object.defineProperties({}, Object.keys(moduleActions)
    .reduce((memo, name) => Object.assign(memo, {
      [name]: {
        get() {
          return moduleActions[name](scene);
        },
      },
    }), {}));
});
