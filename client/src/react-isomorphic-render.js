import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLogger from 'redux-logger';
import routes from './routes';
import reducer from './reducers';
import wrapper from './wrapper';
import asyncSettings from './react-isomorphic-render-async';

const middlewares = [
  thunkMiddleware,
  promiseMiddleware,
];

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger());
}

export default {
  reducer,
  routes,
  wrapper,
  redux_middleware: () => middlewares,
  ...asyncSettings,
};
