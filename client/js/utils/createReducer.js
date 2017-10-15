import { get, set, mapValues } from 'lodash';

const _reducer = {};

export function reducer(state, action) {
  return mapValues(_reducer, (r, key) => r(get(state, key), action));
}

export function install(keyPath, r) {
  set(_reducer, keyPath, r);
}

export default function createReducer(keyPath, initialState, handlers) {
  const r = (state = initialState, action = {}) => {
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };
  set(_reducer, keyPath, r);
  return r;
}
