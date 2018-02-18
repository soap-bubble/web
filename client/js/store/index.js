import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { createStore, applyMiddleware } from 'redux';

import { reducer } from 'utils/createReducer';
import { middleware as epicMiddleware } from 'utils/createEpic';

import loggingMiddleware from './logger';

let store;

export default function () {
  if (!store) {
    let middleware;

    if (process.env.NODE_ENV === 'production') {
      middleware = applyMiddleware(
        epicMiddleware(),
        thunkMiddleware,
        promiseMiddleware,
      );
    } else {
      middleware = applyMiddleware(
        epicMiddleware(),
        thunkMiddleware,
        promiseMiddleware,
        loggingMiddleware,
      );
    }

    store = createStore(
      reducer,
      middleware,
    );
  }
  return store;
}
