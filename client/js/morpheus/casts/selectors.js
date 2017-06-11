import { createSelector } from 'reselect';
import { selectors as gameStateSelectors } from '../gamestate';

const { gamestates } = gameStateSelectors;

const selectCastsCurrent = state => state.casts.current;
const selectCastsBackground = state => state.casts.background;
const selectCastsPrevious = state => state.casts.previous;
const selectCastIsEntering = cast => casts.status === 'entering';
const selectCastIsExiting = cast => casts.status === 'exiting';
const selectCastIsOnStage = cast => casts.status === 'onStage';
const selectCastIsInitiallyEnabled = cast => cast.initiallyEnabled;


export const current = createSelector(
  selectCastsCurrent,
);

export const background = createSelector(
  selectCastsBackground,
);

export const previous = createSelector(
  selectCastsPrevious,
);

export const isCastEntering = createSelector(
  selectCastIsEntering,
);

export const isCastExiting = createSelector(
  selectCastIsExiting,
);

export const isCastOnStage = createSelector(
  selectCastIsOnStage,
);

export const backgroundEnabled = createSelector(
  state => state.casts.background,
  _currentCasts => _currentCasts.filter(
    cast => (selectCastIsEntering(cast) || selectCastIsOnStage(cast)) && isCastEnabled(cast)
  ),
);

export const previousEnabled = createSelector(
  state => state.casts.previous,
  _currentCasts => _currentCasts.filter(
    cast => (isCastExiting(cast) || isCastOnStage(cast)) && isCastEnabled(cast)
  ),
);

export const currentEnabled = createSelector(
  state => state.casts
)

export const isCastEnabled = createSelector(
  [ selectCastIsInitiallyEnabled, selectCastIsEntering, gamestates ],
  (_isCastInitiallyEnabled, _isCastEntering, _gamestates) => {
    let result = comparators.every(({
      gameStateId,
      testType,
      value,
    }) => {
      const gs = _gamestates[gameStateId];

      switch(TEST_TYPES[testType]) {
        case 'EqualTo':
          return value === gs.value;
        case 'NotEqualTo':
          return value !== gs.value;
        case 'GreaterThan':
          return value > gs.value;
        case 'LessThan':
          return value < gs.value
        default:
          return false;
      }
    });
    if (!_isCastInitiallyEnabled) {
      result = !result;
    }
    return result;
  }
);

export { selectors as pano } from 'morpheus/casts/pano';
export { selectors as panoAnim } from 'morpheus/casts/panoAnim';
export { selectors as hotspot } from 'morpheus/casts/hotspot';
