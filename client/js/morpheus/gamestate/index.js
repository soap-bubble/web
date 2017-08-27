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
    const gs = gamestates.byId(gameStateId);
    const gsValue = gs && gs.value;
    let retValue;
    switch (TEST_TYPES[testType]) {
      case 'EqualTo':
        retValue = gs && (gsValue === value);
        break;
      case 'NotEqualTo':
        retValue = gs && (gsValue !== value);
        break;
      case 'GreaterThan':
        retValue = gs && (gsValue > value);
        break;
      case 'LessThan':
        retValue = gs && (gsValue < value);
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
