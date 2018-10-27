import {
  get,
} from 'lodash';
import memoize from 'utils/memoize';
import {
  createSelector,
} from 'reselect';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  handleEventFactory,
} from 'morpheus/input';
import Promise from 'bluebird';
import {
  forMorpheusType,
} from '../matchers';

const selectors = memoize((scene) => {
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

  const selectIsEmptyScene = createSelector(
    selectCasts,
    selectSoundCastsData,
    (casts, soundCastData) => soundCastData.length && !casts.some(cast =>
      ['PanoCast', 'ControlledMovieCast', 'MovieSpecialCast'].indexOf(cast.__t) !== -1),
  );

  const selectHotspotsData = createSelector(
    () => scene,
    s => get(s, 'casts', [])
      .filter(c => c.castId === 0),
  );

  const selectAssetsUrl = createSelector(
    selectSoundCastsData,
    casts => casts.map(cast => get(cast, 'fileName')),
  );

  return {
    soundCastsData: selectSoundCastsData,
    assetsUrl: selectAssetsUrl,
    isEmpty: selectIsEmptyScene,
    hotspotData: selectHotspotsData,
  };
});

const isSoundCast = forMorpheusType('SoundCast');

function isActiveSound({
  casts,
  gamestates,
}) {
  return casts.filter((cast) => {
    if (isSoundCast(cast)) {
      if (cast.comparators.length) {
        return isActive({ cast, gamestates });
      }
    }
    return false;
  });
}


function isEmptySoundCast({
  casts,
  gamestates,
}) {
  const soundCastData = isActiveSound({
    casts,
    gamestates,
  });
  return soundCastData.length && !casts.some(cast =>
    ['PanoCast', 'ControlledMovieCast', 'MovieSpecialCast'].indexOf(cast.__t) !== -1);
}

export const delegate = memoize((scene) => {
  const soundSelectors = selectors(scene);
  const inputHandler = handleEventFactory();
  function applies(state) {
    return isActiveSound({
      casts: scene.casts,
      gamestates: gamestateSelectors.forState(state),
    });
  }

  function doEnter() {
    return (dispatch, getState) => Promise.resolve({
      assetsUrl: isActiveSound({
        casts: scene.casts,
        gamestates: gamestateSelectors.forState(getState()),
      }).map(cast => get(cast, 'fileName')),
    });
  }

  function onStage() {
    return (dispatch, getState) => {
      if (isEmptySoundCast({
        casts: scene.casts,
        gamestates: gamestateSelectors.forState(getState()),
      })) {
        Promise.delay(500).then(() => {
          const eventOptions = {
            currentPosition: { top: 1, left: 1 },
            startingPosition: { top: 1, left: 1 },
            hotspots: soundSelectors.hotspotData(getState()),
            nowInHotspots: [],
            leavingHotspots: [],
            enteringHotspots: [],
            noInteractionHotspots: [],
            isClick: false,
            isMouseDown: false,
            wasMouseMoved: false,
            wasMouseUpped: false,
            wasMouseDowned: false,
            handleHotspot: gamestateActions.handleHotspot,
          };
          return dispatch(inputHandler(eventOptions));
        });
      }
      return Promise.resolve();
    };
  }

  return {
    applies,
    doEnter,
    onStage,
  };
});
