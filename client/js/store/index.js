import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { createStore, applyMiddleware } from 'redux';

import { reducer } from 'utils/createReducer';
import loggingMiddleware from './logger';

let middleware;
if (process.env.NODE_ENV === 'production') {
  middleware = applyMiddleware(thunkMiddleware, promiseMiddleware);
} else {
  middleware = applyMiddleware(thunkMiddleware, promiseMiddleware, loggingMiddleware);
}

const store = createStore(
  reducer,
  middleware,
);

export default store;
