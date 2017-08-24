import {
  get,
  memoize,
} from 'lodash';
import {
  createSelector,
} from 'reselect';


export const selectors = memoize((scene) => {
  const selectCasts = createSelector(
    () => scene,
    s => get(s, 'casts', []),
  );

  const selectSoundCastsData = createSelector(
    selectCasts,
    casts => casts.filter(cast => cast.__t === 'SoundCast'),
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
