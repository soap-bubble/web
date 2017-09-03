import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ENTER,
  UNLOADING,
} from './actionTypes';
import {
  memoize,
} from 'lodash';
import createLogger from 'utils/logger';
import * as modules from './modules';

const logger = createLogger('casts:actions');

function doActionForCast({ event, scene, castType, action }) {
  return dispatch => dispatch(action())
    .then(castState => dispatch({
      type: event,
      payload: castState,
      meta: { type: castType, scene },
    }));
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
  }, {});

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
