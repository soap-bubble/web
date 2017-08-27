import { createSelector } from 'reselect';
import { TEST_TYPES } from '../constants';

export const root = state => state.gamestate;
export const gamestates = createSelector(
  root,
  r => r.get('idMap'),
);

export function castEnabled({ comparators }) {
  return createSelector(
    gamestates,
    _gamestates => comparators.every(({
      gameStateId,
      testType,
      value,
    }) => {
      const gs = _gamestates.get(gameStateId);
      const gsValue = gs.get('value');

      switch (TEST_TYPES[testType]) {
        case 'EqualTo':
          return value === gsValue;
        case 'NotEqualTo':
          return value !== gsValue;
        case 'GreaterThan':
          return value > gsValue;
        case 'LessThan':
          return value < gsValue;
        default:
          return false;
      }
    }),
  );
}

export function forState(state) {
  return {
    byId(id) {
      const gamestate = gamestates(state).get(id);
      return {
        get value() {
          return gamestate.get('value');
        },
        get maxValue() {
          return gamestate.get('maxValue');
        },
        get minValue() {
          return gamestate.get('minValue');
        },
        get stateWraps() {
          return gamestate.get('stateWraps');
        },
        get stateId() {
          return id;
        },
      };
    },
  };
}
