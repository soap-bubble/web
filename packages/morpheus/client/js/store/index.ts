import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware, compose, Store } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import qs from 'query-string'
import { reducer } from 'utils/createReducer'
import { epics } from 'utils/createEpic'
import isDebug from 'utils/isDebug'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const qp = qs.parse(location.search)
let store: Store

export default function() {
  if (!store) {
    let middleware
    const epicMiddleware = createEpicMiddleware()
    if (isDebug) {
      const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
          // @ts-ignore
            actionsBlacklist: ['INPUT_CURSOR_SET_POS', 'GAME_SET_CURSOR'],
          })
        : compose
      middleware = composeEnhancers(
        applyMiddleware(epicMiddleware, thunkMiddleware),
      )
    } else {
      middleware = applyMiddleware(epicMiddleware, thunkMiddleware)
    }

    store = createStore(reducer, middleware)

    epicMiddleware.run(epics())
  }
  return store
}
