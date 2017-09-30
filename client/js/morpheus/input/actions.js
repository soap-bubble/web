import { Observable } from 'rxjs';
import createEpic from 'utils/createEpic';
import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
  KEY_DOWN,
  KEY_UP,
} from './actionTypes';

const inputObservables = {};

export const keyInputEpic = createEpic((action$, store) => action$
  .ofType(KEY_DOWN, KEY_UP)
  .distinctUntilChanged()
  .ofType(KEY_DOWN)
  .mergeMap((action) => {
    if (inputObservables[action.payload]) {
      return Observable.of(...inputObservables[action.payload])
        .mergeMap(handler => Observable.of(handler(action, store)))
        .filter(a => !!a);
    }
    return [];
  }),
);

export function inputHandler({
  key,
  keys,
  handler,
}) {
  function addKey(k, h) {
    if (!inputObservables[k]) {
      inputObservables[k] = [];
    }
    inputObservables[k].push(h);
  }
  if (key) {
    addKey(key, handler);
  }
  if (keys) {
    keys.forEach(k => addKey(k, handler));
  }
}

export function keyDown(keyCode) {
  return {
    type: KEY_DOWN,
    payload: keyCode,
  };
}

export function keyUp(keyCode) {
  return {
    type: KEY_UP,
    payload: keyCode,
  };
}

export function disableControl() {
  return {
    type: DISABLE_CONTROL,
  };
}

export function enableControl() {
  return {
    type: ENABLE_CONTROL,
  };
}
