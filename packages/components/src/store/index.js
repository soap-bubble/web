import thunkMiddleware from 'redux-thunk';
import logger from 'redux-logger';
import { createStore, applyMiddleware, combineReducers } from 'redux';

const middlewares = [
  thunkMiddleware,
  logger,
];


export default function (reducers) {
  'ngInject';

  const store = createStore(
    combineReducers(reducers),
    applyMiddleware(...middlewares),
  );

  return store;
}
