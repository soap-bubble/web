import {
  get,
  flow,
  partialRight,
  filter,
  entries,
  map,
} from 'lodash';
import { createSelector } from 'reselect';
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

const root = state => state.casts;

function allSceneIdsForStatus(status) {
  return createSelector(
    root,
    flow(
      ({ cache }) => cache || {},
      entries,
      partialRight(filter, ([sceneId, cacheEntry]) => sceneId && cacheEntry.status === status),
      partialRight(map, ([sceneId]) => sceneId),
    ),
  );
}

export const preloadedSceneIds = allSceneIdsForStatus(PRELOAD);

export function forScene(scene) {
  const selectCastCacheForThisScene = state => get(state, `casts.cache[${scene.sceneId}]`);

  const forStatus = status => createSelector(
      selectCastCacheForThisScene,
      cast => cast.status === status,
    );

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
