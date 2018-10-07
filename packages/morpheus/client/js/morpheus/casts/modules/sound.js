import {
  get,
  memoize,
} from 'lodash';
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

export const delegate = memoize((scene) => {
  const soundSelectors = selectors(scene);
  const inputHandler = handleEventFactory();
  function applies(state) {
    return soundSelectors.soundCastsData(state).length;
  }

  function onStage() {
    return (dispatch, getState) => {
      if (soundSelectors.isEmpty(getState())) {
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
    onStage,
  };
});
