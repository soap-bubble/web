import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import {
  TEST_TYPES,
} from '../constants';

function doCompare({
  comparator: {
    gameStateId,
    testType,
    value,
  },
  gamestates,
}) {
  const gs = gamestates.byId(gameStateId);
  const gsValue = gs && gs.value;
  switch (TEST_TYPES[testType]) {
    case 'EqualTo':
      return gs && (gsValue === value);
    case 'NotEqualTo':
      return gs && (gsValue !== value);
    case 'GreaterThan':
      return gs && (gsValue > value);
    case 'LessThan':
      return gs && (gsValue < value);
    default:
      return true;
  }
}

export function isActive({ cast, gamestates }) {
  const { initiallyEnabled = true, comparators = [] } = cast;
  let result = true;
  for (let i = 0; i < comparators.length; i++) {
    const comparator = comparators[i];
    if (!doCompare({
      comparator,
      gamestates,
    })) {
      result = false;
      break;
    }
  }
  if (!initiallyEnabled) {
    result = !result;
  }
  return result;
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
