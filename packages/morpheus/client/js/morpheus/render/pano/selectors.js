import { get, uniq } from 'lodash';
import { createSelector } from 'reselect';
import {
  getPanoAnimUrl,
} from 'service/gamedb';
import {
  isActive,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';

export default (scene) => {
  const selectPanoCastData = createSelector(
    () => scene,
    s => get(s, 'casts', []).find(c => c.__t === 'PanoCast'),
  );
  const allCasts = () => get(scene, 'casts', []);
  const selectPanoAnimData = createSelector(
    allCasts,
    casts => casts
      .filter(c => c.__t === 'PanoAnim'),
  );
  const selectEnabledPanoAnimData = createSelector(
    selectPanoAnimData,
    gamestateSelectors.forState,
    (panos, gamestates) => panos
      .filter(c => isActive({ cast: c, gamestates })),
  );
  const mapPanoAnimDataToUniqueFilenames = panoAnimData => uniq(
    panoAnimData
      .map(p => p.fileName),
    )
      .map(getPanoAnimUrl);

  const selectPanoAnimFilenames = createSelector(
    selectPanoAnimData,
    mapPanoAnimDataToUniqueFilenames,
  );
  const selectIsPanoAnim = createSelector(
    selectPanoAnimFilenames,
    filenames => !!filenames.length,
  );
  const selectEnabledFilenames = createSelector(
    selectEnabledPanoAnimData,
    mapPanoAnimDataToUniqueFilenames,
  );
  const selectIsPano = createSelector(
    () => scene,
    (sceneData) => {
      const { casts } = sceneData;
      return !!(casts.find(c => c.__t === 'PanoCast'));
    },
  );

  return {
    panoCastData: selectPanoCastData,
    isPano: selectIsPano,
    panoAnimData: selectPanoAnimData,
    enabledPanoAnimData: selectEnabledPanoAnimData,
    filenames: selectPanoAnimFilenames,
    enabledFilenames: selectEnabledFilenames,
    isPanoAnim: selectIsPanoAnim,
  };
};
