import { createLogger } from 'redux-logger';
import { routerMiddleware } from 'react-router-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { middleware as epicMiddleware } from '../utils/createEpic';

import history from '../routes/history';


import reducers from '../reducers';

const middlewares = [
  epicMiddleware(),
  routerMiddleware(history),
];

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger());
}

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(...middlewares),
);

export default store;
