import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import history from '../routes/history';
import { routerMiddleware } from 'react-router-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';

import reducers from '../reducers';

const routingMiddleware = routerMiddleware(history);
const loggingMiddleware = process.env.NODE_ENV !== 'production' ? createLogger() : undefined;

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(thunkMiddleware, loggingMiddleware, routingMiddleware),
);

export default store;
