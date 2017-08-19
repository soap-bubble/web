import {
  get,
  isUndefined,
  memoize,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import createSound from 'utils/sound';
import {
  getSceneType,
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  defer,
} from 'utils/promise';

export const selectors = memoize((scene) => {
  const selectCasts = createSelector(
    () => scene,
    scene => get(scene, 'casts', []),
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
