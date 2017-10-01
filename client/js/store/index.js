import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { createStore, applyMiddleware } from 'redux';

import { reducer } from 'utils/createReducer';
import { middleware as epicMiddleware } from 'utils/createEpic';

import loggingMiddleware from './logger';

let middleware;
// middleware = applyMiddleware(thunkMiddleware, promiseMiddleware);
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

const store = createStore(
  reducer,
  middleware,
);

export default store;
