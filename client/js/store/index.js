import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';

import morphReducer from '../reducers';

const loggingMiddleware = createLogger();

const store = createStore(
  morphReducer,
  applyMiddleware(thunkMiddleware, promiseMiddleware),
);

export default store;
