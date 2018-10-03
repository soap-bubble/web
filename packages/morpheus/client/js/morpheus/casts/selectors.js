import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';
import * as modules from './modules';
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ON_MOUNT,
  UNLOADING,
} from './actionTypes';

const forSceneSelectorExtensions = {};
export function extendForScene(name, selectorFactory) {
  forSceneSelectorExtensions[name] = selectorFactory;
}

export function forScene(scene) {
  const selectCastCacheForThisScene = state => get(state, `casts.cache[${scene.sceneId}]`);
  const selectCastIsEntering = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === ENTERING,
  );
  const selectCastIsOnStage = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === ON_STAGE,
  );
  const selectCastIsExiting = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === EXITING,
  );

  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isEntering: selectCastIsEntering,
    isOnStage: selectCastIsOnStage,
    isExiting: selectCastIsExiting,
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
