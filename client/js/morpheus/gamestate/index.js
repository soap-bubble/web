import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import {
  TEST_TYPES,
} from '../constants';

export function isActive({ cast, gamestates }) {
  const { initiallyEnabled = true, comparators = [] } = cast;
  return comparators.length === 0 || comparators.every(({
    gameStateId,
    testType,
    value,
  }) => {
    const gs = gamestates[gameStateId];
    let retValue;
    switch (TEST_TYPES[testType]) {
      case 'EqualTo':
        retValue = gs && (gs.value === value);
        break;
      case 'NotEqualTo':
        retValue = gs && (gs.value !== value);
        break;
      case 'GreaterThan':
        retValue = gs && (gs.value > value);
        break;
      case 'LessThan':
        retValue = gs && (gs.value < value);
        break;
      default:
        retValue = true;
    }
    retValue = initiallyEnabled ? retValue : !retValue;
    return retValue;
  });
}

export {
  selectors,
  reducer,
  actions,
};

export default {
  selectors,
  reducer,
  actions,
};
