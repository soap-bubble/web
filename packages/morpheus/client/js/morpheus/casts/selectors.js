import {
  flow,
  partialRight,
  filter,
  entries,
  map,
} from 'lodash';
import cache from './cache';
import * as modules from './modules';
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  PRELOAD,
  UNLOADING,
} from './actionTypes';

const forSceneSelectorExtensions = {};
export function extendForScene(name, selectorFactory) {
  forSceneSelectorExtensions[name] = selectorFactory;
}

function allSceneIdsForStatus(status) {
  return flow(
    () => cache,
    entries,
    partialRight(filter, ([sceneId, cacheEntry]) => sceneId && cacheEntry.status === status),
    partialRight(map, ([sceneId]) => Number(sceneId)),
  );
}

export const preloadedSceneIds = allSceneIdsForStatus(PRELOAD);

export function forScene(scene) {
  const selectCastCacheForThisScene = () => (scene && cache[scene.sceneId]) || {};

  const forStatus = status => selectCastCacheForThisScene().status === status;

  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isLoading: forStatus(LOADING),
    isEntering: forStatus(ENTERING),
    isOnStage: forStatus(ON_STAGE),
    isExiting: forStatus(EXITING),
    isUnloading: forStatus(UNLOADING),
    isPreloading: forStatus(PRELOAD),
  };
  const moduleSelectors = Object.keys(modules).reduce((memo, name) => {
    if (modules[name].selectors) {
      memo[name] = modules[name].selectors;
    }
    return memo;
  }, {});
  Object.defineProperties(castSelectors, Object.keys(moduleSelectors)
    .reduce((memo, name) => Object.assign(memo, {
      [name]: {
        get() {
          return moduleSelectors[name](scene);
        },
      },
    }), {}),
  );

  return castSelectors;
}
