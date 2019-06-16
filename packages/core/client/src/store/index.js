import { createLogger } from 'redux-logger';
import { createRouter } from '@respond-framework/rudy';
import { createEpicMiddleware } from 'redux-observable';;
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';

import routeMap from '../routes';
import { epics } from '../utils/createEpic';
import reducers from '../reducers';

export default (preloadedState, initialEntries) => {
  const options = { initialEntries };
  const { reducer, middleware: routerMiddleware, firstRoute } = createRouter(Object.keys(routeMap).reduce((memo, route) => {
    memo[route] = routeMap[route].path;
    return memo;
  }, {}), options);
  const epicMiddleware = createEpicMiddleware();
  const middlewares = [
    epicMiddleware,
    routerMiddleware,
  ];

  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(createLogger());
  }
  const composeEnhancers =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    }) : compose;

  const rootReducer = combineReducers({ location: reducer, ...reducers });
  const enhancers = composeEnhancers(applyMiddleware(...middlewares));

  const store = createStore(rootReducer, preloadedState, enhancers);
  epicMiddleware.run(epics());
  return { store, firstRoute };
}
