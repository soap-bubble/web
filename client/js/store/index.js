import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';

import reducer from '../reducers';

const loggingMiddleware = process.env.NODE_ENV !== 'production' ? createLogger() : undefined;

const store = createStore(
  reducer,
  applyMiddleware(thunkMiddleware, loggingMiddleware),
);

export default store;
