import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/filter';
import { Observable } from 'rxjs/Observable';
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
  .mergeMap((action) => {
    if (inputObservables[action.payload]) {
      return Observable.of(...inputObservables[action.payload])
        .map((h) => {
          if (action.type === KEY_DOWN) {
            return h.down;
          }
          return h.up;
        })
        .filter(h => h)
        .mergeMap(handler => Observable.of(handler(action, store)));
    }
    return [];
  })
  .filter(a => !!a),
);

export function inputHandler({
  key,
  keys,
  down,
  up,
}) {
  function addKey(k, h) {
    if (!inputObservables[k]) {
      inputObservables[k] = [];
    }
    inputObservables[k].push(h);
  }
  if (key) {
    addKey(key, {
      down,
      up,
    });
  }
  if (keys) {
    keys.forEach(k => addKey(k, {
      down,
      up,
    }));
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
