import {
  get,
  last,
  map,
} from 'lodash';
import createLogger from 'redux-logger';

let dispatches = [];
const logger = createLogger({
  colors: {
    prevState: false,
    nextState: false,
  },
});
let _enabled = false;

export default store => next => (action) => {
  dispatches.push(action);
  // console.log(action);
  return _enabled ? logger(store)(() => {
    next(action);
  })(action) : next(action);
};

export function lastActionType() {
  return get(last(dispatches), 'type');
}

export function actions() {
  return map(dispatches, 'type');
}

export function enable() {
  _enabled = true;
}

export function reset() {
  dispatches = [];
  _enabled = false;
}
