import {
  memoize,
} from 'lodash';
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ON_MOUNT,
  UNLOADING,
} from './actionTypes';
import * as modules from './modules';


function dispatchCastState({ event, castState, castType, scene }) {
  return {
    type: event,
    payload: castState,
    meta: { type: castType, scene },
  };
}

function doActionForCast({ event, scene, castType, action }) {
  return dispatch => dispatch(action())
    .then(castState => dispatch(dispatchCastState({
      event,
      castState,
      castType,
      scene,
    })));
}

export const lifecycle = [{
  action: 'doLoad',
  event: LOADING,
}, {
  action: 'doEnter',
  event: ENTERING,
}, {
  action: 'onStage',
  event: ON_STAGE,
}, {
  action: 'doExit',
  event: EXITING,
}, {
  action: 'doUnload',
  event: UNLOADING,
}]
  .reduce((memo, { action, event }) => {
    memo[action] = function moduleAction(scene) {
      return (dispatch, getState) => Promise.all(Object.keys(modules).map((cast) => {
        const module = modules[cast];
        const delegate = module.delegate && module.delegate(scene);
        if (delegate && delegate && delegate[action] && delegate.applies(getState())) {
          return dispatch(doActionForCast({
            event,
            scene,
            castType: cast,
            action: delegate[action],
          }));
        }
        return Promise.resolve();
      }))
          .then(() => scene);
    };
    return memo;
  }, {
    onMount({
      scene,
      castType,
      ...castState
    }) {
      return dispatchCastState({
        event: ON_MOUNT,
        scene,
        castType,
        castState,
      });
    },
  });

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
