import { createSelector } from 'reselect';
import { TEST_TYPES } from '../constants';

export const gamestates = state => state.gamestate.idMap;

export function castEnabled({ comparators }) {
  return createSelector(
    gamestates,
    _gamestates => comparators.every(({
      gameStateId,
      testType,
      value,
    }) => {
      const gs = _gamestates[gameStateId];

      switch (TEST_TYPES[testType]) {
        case 'EqualTo':
          return value === gs.value;
        case 'NotEqualTo':
          return value !== gs.value;
        case 'GreaterThan':
          return value > gs.value;
        case 'LessThan':
          return value < gs.value;
        default:
          return false;
      }
    }),
  );
}
