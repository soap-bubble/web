import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { createStore, applyMiddleware } from 'redux';
import qs from 'query-string';
import { reducer } from 'utils/createReducer';
import { middleware as epicMiddleware } from 'utils/createEpic';

import loggingMiddleware from './logger';

const qp = qs.parse(location.search);
let store;

export default function () {
  if (!store) {
    let middleware;
    if (process.env.NODE_ENV === 'production') {
      middleware = applyMiddleware(
        epicMiddleware(),
        thunkMiddleware,
        promiseMiddleware,
      );
    } else {
      // eslint-disable-next-line
      const compose = qp.reduxDev ? require('redux-devtools-extension').composeWithDevTools({})
      // eslint-disable-next-line
        : require('redux').compose;

      middleware = compose(
        applyMiddleware(
          epicMiddleware(),
          thunkMiddleware,
          promiseMiddleware,
          loggingMiddleware,
        ),
      );
    }

    store = createStore(
      reducer,
      middleware,
    );
  }
  return store;
}
