import { isUndefined } from 'lodash';

export default function createReducer(initialState, handlers) {
  return function reducer(parentState, stateKey, action) {
    let state = parentState[stateKey];
    if (isUndefined(state)) {
      state = initialState;
    }
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return handlers[action.type](state, action, parentState);
    }
    return state;
  };
}
