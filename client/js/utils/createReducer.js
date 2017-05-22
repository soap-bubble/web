import { isUndefined, set, mapValues } from 'lodash';

const _reducer = {};
export function reducer(state, action) {
  return mapValues(_reducer, (r, key) => r(state, key, action));
}

export default function createReducer(keyPath, initialState, handlers) {
  const r = (parentState = {}, stateKey, action) => {
    let state = parentState[stateKey];
    if (isUndefined(state)) {
      state = initialState;
    }
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return handlers[action.type](state, action, parentState);
    }
    return state;
  };
  set(_reducer, keyPath, r);
  return r;
}
