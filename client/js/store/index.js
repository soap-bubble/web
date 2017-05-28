import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';

import 'morpheus/casts';
import 'morpheus/game';
import 'morpheus/gamestate';
import 'morpheus/hotspot';
import 'morpheus/pano';
import 'morpheus/panoAnim';
import 'morpheus/scene';
import 'morpheus/transition';
import 'morpheus/video';

import { reducer } from 'utils/createReducer';

let middleware;
if (process.env.NODE_ENV === 'production') {
  middleware = applyMiddleware(thunkMiddleware, promiseMiddleware);
} else {
  const loggingMiddleware = createLogger();
  middleware = applyMiddleware(thunkMiddleware, promiseMiddleware, loggingMiddleware);
}

const store = createStore(
  reducer,
  middleware,
);

export default store;
