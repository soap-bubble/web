import routes  from './routes';
import reducer from './reducers';
import wrapper from './wrapper';
import asyncSettings from './react-isomorphic-render-async';

export default {
  reducer,
  routes,
  wrapper,
  ...asyncSettings
};
