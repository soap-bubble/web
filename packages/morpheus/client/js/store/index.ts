import thunkMiddleware from 'redux-thunk'
import {
  createStore,
  applyMiddleware,
  compose,
  Store,
  Middleware,
  Action,
} from 'redux'
import { createEpicMiddleware, Epic } from 'redux-observable'
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
    const epicMiddleware = epicMiddlewareInstance as Middleware
    const thunkAsMiddleware = thunkMiddleware as Middleware
    if (isDebug) {
      const composeEnhancers =
        typeof window !== 'undefined' &&
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
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

    epicMiddlewareInstance.run(
      epics() as unknown as Epic<unknown, unknown, void, any>
    )
  }
  return store
}
