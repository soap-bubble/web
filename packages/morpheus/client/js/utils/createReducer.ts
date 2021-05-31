import { get, set, mapValues } from 'lodash';

type Reducer = (state: any, action: any) => any
type ReducerMap = {
  [key: string]: ReducerMap|Reducer
}

const _reducer = {} as ReducerMap;


export function reducer(state: any, action: any) {
  return mapValues(_reducer, (r, key) => (r as Reducer)(get(state, key), action));
}

export function install(keyPath: string, r: Reducer) {
  set(_reducer, keyPath, r);
}

export default function createReducer(keyPath: string, initialState: any, handlers: { [key: string]: Reducer}) {
  const r = (state = initialState, action = {} as { type: string }) => {
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return (handlers[action.type] as Reducer)(state, action);
    }
    return state;
  };
  set(_reducer, keyPath, r);
  return r;
}
