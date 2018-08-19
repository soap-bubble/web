import {
  memoize,
} from 'lodash';
import {
  forScene as selectorsForScene,
} from './selectors';
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ON_MOUNT,
  UNLOADING,
} from './actionTypes';
import * as modules from './modules';


export function dispatchCastState({ event, castState, castType, scene }) {
  return {
    type: event,
    payload: castState,
    meta: { type: castType, scene },
  };
}

function doActionForCast({ event, scene, castType, action }) {
  return (dispatch) => {
    function setState(state) {
      return dispatch(dispatchCastState({
        event,
        castState: state,
        castType,
        scene,
      }));
    }
    return dispatch(action(setState))
      .then(setState)
      .catch((err) => {
        console.error(err);
      });
  };
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
      return (dispatch, getState) => Promise.all(Object.keys(modules.default).map((cast) => {
        const module = modules.default[cast];
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
  const moduleActions = Object.keys(modules.default).reduce((memo, name) => {
    if (modules.default[name].actions) {
      memo[name] = modules.default[name].actions;
    }
    return memo;
  }, {});
  return Object.defineProperties({
    update(payload) {
      return (dispatch) => {
        Object.keys(modules.default).forEach((name) => {
          const module = modules.default[name];
          if (module
            && module.delegate
          ) {
            const delegate = module.delegate(scene);
            if (delegate.update && delegate.applies(scene)) {
              try {
                dispatch(delegate.update(payload));
              } catch (err) {
                console.error(err);
              }
            }
          }
        });
      };
    },
  }, Object.keys(moduleActions)
    .reduce((memo, name) => Object.assign(memo, {
      [name]: {
        get() {
          return moduleActions[name](scene);
        },
      },
    }), {}));
});
