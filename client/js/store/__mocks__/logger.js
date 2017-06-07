import {
  last,
  map,
} from 'lodash';

let dispatches = [];

export default () => next => (action) => {
  dispatches.push(action);
  return next(action);
};

export function lastActionType() {
  return last(dispatches).type;
}

export function actions() {
  return map(dispatches, 'type');
}

export function reset() {
  dispatches = [];
}
