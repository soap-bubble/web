import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware, compose, Store, Middleware } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import { reducer } from 'utils/createReducer'
import { epics } from 'utils/createEpic'
import isDebug from 'utils/isDebug'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
  }
}

let store: Store

export default function () {
  if (!store) {
    let middleware
    const epicMiddlewareInstance = createEpicMiddleware()
    const epicMiddleware = epicMiddlewareInstance as unknown as Middleware
    const thunkAsMiddleware = thunkMiddleware as unknown as Middleware
    if (isDebug) {
      const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            // @ts-ignore
            actionsBlacklist: ['INPUT_CURSOR_SET_POS', 'GAME_SET_CURSOR'],
          })
        : compose
      middleware = composeEnhancers(
        applyMiddleware(epicMiddleware, thunkAsMiddleware)
      )
    } else {
      middleware = applyMiddleware(epicMiddleware, thunkAsMiddleware)
    }

    store = createStore(reducer, middleware)

    epicMiddlewareInstance.run(epics())
  }
  return store
}
