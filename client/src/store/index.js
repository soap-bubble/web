import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import history from '../routes/history';
import { routerMiddleware } from 'react-router-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';

import reducers from '../reducers';

const middlewares = [
  thunkMiddleware,
  routerMiddleware(history),
];

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger());
}

const store = createStore(
  combineReducers(reducers),
  applyMiddleware.apply(null, middlewares),
);

export default store;
