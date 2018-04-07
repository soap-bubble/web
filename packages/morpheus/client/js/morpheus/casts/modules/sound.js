import {
  get,
  memoize,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';

export const selectors = memoize((scene) => {
  const selectCasts = createSelector(
    () => scene,
    s => get(s, 'casts', []),
  );

  const selectSoundCastsData = createSelector(
    selectCasts,
    gamestateSelectors.forState,
    (casts, gamestates) => casts.filter((cast) => {
      if (cast.__t === 'SoundCast') {
        if (cast.comparators.length) {
          return isActive({ cast, gamestates });
        }
        return true;
      }
      return false;
    }),
  );

  const selectAssetsUrl = createSelector(
    selectSoundCastsData,
    casts => casts.map(cast => get(cast, 'fileName')),
  );

  return {
    soundCastsData: selectSoundCastsData,
    assetsUrl: selectAssetsUrl,
  };
});

export const delegate = memoize((scene) => {
  const soundSelectors = selectors(scene);
  function applies(state) {
    return soundSelectors.soundCastsData(state).lenth;
  }

  return {
    applies,
  };
});
