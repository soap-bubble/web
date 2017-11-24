import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLogger from 'redux-logger';
import { middleware as epicMiddleware } from './utils/createEpic';
import routes from './routes';
import reducer from './reducers';
import wrapper from './wrapper';
import asyncSettings from './react-isomorphic-render-async';

const middlewares = [
  // thunkMiddleware,
  // promiseMiddleware,
];

if (process.env.NODE_ENV !== 'production') {
//  middlewares.push(createLogger());
}

middlewares.push(epicMiddleware);

export default {
  reducer,
  routes,
  wrapper,
  redux_middleware: () => middlewares,
  ...asyncSettings,
};
