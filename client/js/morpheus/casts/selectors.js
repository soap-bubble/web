import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';
import { selectors as gameStateSelectors } from 'morpheus/gamestate';
import { selectors as sceneSelectors } from 'morpheus/scene';
import * as modules from './modules';
const { gamestates } = gameStateSelectors;

// const selectCastsFromScene = scene => get(scene, 'casts', []);
// const selectCastsCurrent = createSelector(
//   sceneSelectors.currentSceneData,
//   selectCastsFromScene,
// );
// const selectCastsBackground = createSelector(
//   sceneSelectors.backgroundSceneData,
//   selectCastsFromScene,
// );
// const selectCastsPrevious = createSelector(
//   sceneSelectors.previousSceneData,
//   selectCastsFromScene,
// );

const forSceneSelectorExtensions = {};
export function extendForScene(name, selectorFactory) {
  forSceneSelectorExtensions[name] = selectorFactory;
}

export function forScene(scene) {
  const selectCastCacheForThisScene = state => get(state, `casts.cache[${scene.sceneId}]`);
  const selectCastIsEntering = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === 'entering',
  );
  const selectCastIsOnStage = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === 'onStage',
  );
  const selectCastIsExiting = createSelector(
    selectCastCacheForThisScene,
    cast => cast.status === 'exiting',
  );

  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isEntering: selectCastIsEntering,
    isOnStage: selectCastIsOnStage,
    isExiting: selectCastIsExiting,
    casts: () => selectCastsFromScene(scene),
  };
  const moduleSelectors = Object.keys(modules).reduce((memo, name) => {
    if (modules[name].selectors) {
      memo[name] = modules[name].selectors;
    }
    return memo;
  }, {});
  Object.defineProperties(castSelectors, Object.keys(moduleSelectors)
    .reduce((memo, name) => {
      return Object.assign(memo, {
        [name]: {
          get: function () {
            return moduleSelectors[name](scene);
          },
        },
      })
    }, {}),
  );

  return castSelectors;
}


const selectCastIsInitiallyEnabled = cast => cast.initiallyEnabled;

//
// export const backgroundEnabled = createSelector(
//   sceneSelectors.backgroundSceneData
//   backgroundSceneData => selectCastsFromScene(selectForScene(backgroundSceneData)),
//   _currentCasts => _currentCasts.filter(
//     cast => (selectCastIsEntering(cast) || selectCastIsOnStage(cast)) && isCastEnabled(cast)
//   ),
// );
//
// export const previousEnabled = createSelector(
//   state => state.casts.previous,
//   _currentCasts => _currentCasts.filter(
//     cast => (isCastExiting(cast) || isCastOnStage(cast)) && isCastEnabled(cast)
//   ),
// );
//
// export const currentEnabled = createSelector(
//   state => state.casts
// )
//
// export const isCastEnabled = createSelector(
//   [ selectCastIsInitiallyEnabled, selectCastIsEntering, gamestates ],
//   (_isCastInitiallyEnabled, _isCastEntering, _gamestates) => {
//     let result = comparators.every(({
//       gameStateId,
//       testType,
//       value,
//     }) => {
//       const gs = _gamestates[gameStateId];
//
//       switch(TEST_TYPES[testType]) {
//         case 'EqualTo':
//           return value === gs.value;
//         case 'NotEqualTo':
//           return value !== gs.value;
//         case 'GreaterThan':
//           return value > gs.value;
//         case 'LessThan':
//           return value < gs.value
//         default:
//           return false;
//       }
//     });
//     if (!_isCastInitiallyEnabled) {
//       result = !result;
//     }
//     return result;
//   }
// );
