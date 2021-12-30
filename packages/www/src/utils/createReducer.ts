import { get, set, mapValues } from "lodash";
import { Action, AnyAction, Reducer } from "redux";

type ReducerMap<S> = {
  [key: string]: ReducerMap<S> | Reducer<S>;
};

const _reducer = {} as ReducerMap<unknown>;

export function reducer(state: any, action: any) {
  return mapValues(_reducer, (r, key) =>
    (r as Reducer)(get(state, key), action)
  );
}

export function install(keyPath: string, r: Reducer) {
  set(_reducer, keyPath, r);
}

export default function createReducer<S, A extends Action<any> = AnyAction>(
  keyPath: string,
  initialState: S,
  handlers: { [key: string]: (state: S, action: A) => S }
) {
  const r = (state = initialState, action = {} as A) => {
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return (handlers[action.type] as Reducer<S>)(state, action);
    }
    return state;
  };
  set(_reducer, keyPath, r);
  return r;
}
