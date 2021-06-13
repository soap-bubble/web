import { get } from "lodash";
import memoize from "utils/memoize";
import loggerFactory from "utils/logger";
import cache from "./cache";
import { selectors as sceneSelectors } from "morpheus/scene";
import createWebGLRendererPool from "./webglPool";
import { forScene as cacheForScene, preloadedSceneIds } from "./selectors";
import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  PAUSE,
  RESUME,
  UNLOADING,
  UNPRELOAD,
} from "./actionTypes";
import * as modules from "./modules";

const logger = loggerFactory("cast:actions");

const webGlPool = createWebGLRendererPool();

function updateCache({ actionName, sceneId, castData, castType }) {
  if (["doUnload", "doPreunload"].indexOf(actionName) !== -1) {
    delete cache[sceneId];
  } else {
    const oldSceneCache = cache[sceneId] ? cache[sceneId] : {};
    cache[sceneId] = {
      ...cache[sceneId],
      [castType]: {
        ...oldSceneCache[castType],
        ...castData,
      },
    };
  }
}

export function dispatchCastState({ event, castState, castType, scene }) {
  return {
    type: event,
    payload: { type: castType, scene, castState },
  };
}

function doActionForCast({ event, scene, castType, action, actionName }) {
  return (dispatch) => {
    const myCache = get(cache, `${scene.sceneId}.${castType}`, {});
    logger.info({
      message: "doActionForCast",
      sceneId: scene.sceneId,
      actionName,
      castType,
    });
    function setState(state) {
      dispatch(
        dispatchCastState({
          event,
          castState: state,
          castType,
          scene,
        })
      );
      updateCache({
        actionName,
        castData: state,
        castType,
        sceneId: scene.sceneId,
      });
    }
    return Promise.resolve(
      dispatch(
        action({
          setState,
          webGlPool,
          modules: cache[scene.sceneId],
          ...myCache,
        })
      )
    )
      .then(setState)
      .catch((err) => {
        console.error(err);
      });
  };
}

export const lifecycle = [
  {
    action: "doPreload",
    event: PRELOAD,
  },
  {
    action: "doLoad",
    event: LOADING,
  },
  {
    action: "doEnter",
    event: ENTERING,
  },
  {
    action: "onStage",
    event: ON_STAGE,
  },
  {
    action: "doExit",
    event: EXITING,
  },
  {
    action: "doPause",
    event: PAUSE,
  },
  {
    action: "doResume",
    event: RESUME,
  },
  {
    action: "doUnload",
    event: UNLOADING,
  },
  {
    action: "doPreunload",
    event: UNPRELOAD,
  },
].reduce((memo, { action, event }) => {
  memo[action] = function moduleAction(scene) {
    return (dispatch, getState) =>
      Promise.all(
        Object.keys(modules.default).map((cast) => {
          const module = modules.default[cast];
          if (scene) {
            const delegate = module.delegate && module.delegate(scene);
            if (
              delegate &&
              delegate &&
              delegate[action] &&
              delegate.applies(getState())
            ) {
              let promise = dispatch(
                doActionForCast({
                  event,
                  scene,
                  castType: cast,
                  action: delegate[action],
                  actionName: action,
                })
              );
              if (action === "doUnload") {
                promise = promise.then((result) => {
                  if (module.selectors && module.selectors.cache) {
                    module.selectors.cache.delete(scene._id);
                  }
                  if (module.delegate && module.delegate.cache) {
                    module.delegate.cache.delete(scene._id);
                  }
                  if (module.actions && module.actions.cache) {
                    module.actions.cache.delete(scene._id);
                  }
                  return result;
                });
              }
              return promise;
            }
          }
          return Promise.resolve();
        })
      ).then(() => scene);
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
  return Object.defineProperties(
    {
      update(updateEvent) {
        return (dispatch) => {
          Object.keys(modules.default).forEach((name) => {
            const module = modules.default[name];
            if (module && module.delegate) {
              const delegate = module.delegate(scene);
              if (delegate.update && delegate.applies(scene)) {
                try {
                  dispatch(
                    delegate.update({
                      ...cacheForScene(scene).cache()[name],
                      updateEvent,
                    })
                  );
                } catch (err) {
                  console.error(err);
                }
              }
            }
          });
        };
      },
    },
    Object.keys(moduleActions).reduce(
      (memo, name) =>
        Object.assign(memo, {
          [name]: {
            get() {
              return moduleActions[name](scene);
            },
          },
        }),
      {}
    )
  );
});

export function unpreloadAll() {
  return (dispatch, getState) =>
    dispatch(unpreloadScenes(...preloadedSceneIds(getState())));
}
