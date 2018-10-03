import {
  memoize,
} from 'lodash';
import loggerFactory from 'utils/logger';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import createWebGLRendererPool from './webglPool';
import {
  preloadedSceneIds,
} from './selectors';
import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  UNLOADING,
  UNPRELOAD,
} from './actionTypes';
import * as modules from './modules';

const logger = loggerFactory('cast:actions');

const webGlPool = createWebGLRendererPool({
  width: window.innerWidth,
  height: window.innerHeight,
});

export function dispatchCastState({ event, castState, castType, scene }) {
  return {
    type: event,
    payload: castState,
    meta: { type: castType, scene },
  };
}

function doActionForCast({
  event,
  scene,
  castType,
  action,
  actionName,
}) {
  return (dispatch) => {
    logger.info({
      message: 'doActionForCast',
      sceneId: scene.sceneId,
      actionName,
      castType,
    });
    function setState(state) {
      return dispatch(dispatchCastState({
        event,
        castState: state,
        castType,
        scene,
      }));
    }
    return dispatch(action({
      setState,
      webGlPool,
    }))
      .then(setState)
      .catch((err) => {
        console.error(err);
      });
  };
}

export const lifecycle = [{
  action: 'doPreload',
  event: PRELOAD,
}, {
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
}, {
  action: 'doPreunload',
  event: UNPRELOAD,
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
            actionName: action,
          }));
        }
        return Promise.resolve();
      }))
          .then(() => scene);
    };
    return memo;
  }, {});

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

export function unpreloadScenes(...sceneIds) {
  return (dispatch, getState) => Promise.all(sceneIds
    .map(sceneId => sceneSelectors.sceneFromCache(sceneId)(getState()))
    .map(scene => dispatch(lifecycle.doPreunload(scene))),
  );
}

export function unpreloadAll() {
  return (dispatch, getState) => dispatch(unpreloadScenes(...preloadedSceneIds(getState())));
}
