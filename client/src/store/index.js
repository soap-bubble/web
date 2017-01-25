import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { browserHistory } from 'react-router';
//import { routerMiddleware } from 'react-router-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';

import reducers from '../reducers';

//const routingMiddleware = routerMiddleware(browserHistory);
const loggingMiddleware = process.env.NODE_ENV !== 'production' ? createLogger() : undefined;

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(thunkMiddleware, loggingMiddleware),
);

export default store;
