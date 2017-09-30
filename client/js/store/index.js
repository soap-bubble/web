import { createEpicMiddleware } from 'redux-observable';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { createStore, applyMiddleware } from 'redux';

import { reducer } from 'utils/createReducer';
import { epics } from 'utils/createEpic';

import loggingMiddleware from './logger';

let middleware;
// middleware = applyMiddleware(thunkMiddleware, promiseMiddleware);
if (process.env.NODE_ENV === 'production') {
  middleware = applyMiddleware(
    createEpicMiddleware(epics()),
    thunkMiddleware,
    promiseMiddleware,
  );
} else {
  middleware = applyMiddleware(
    createEpicMiddleware(epics()),
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
