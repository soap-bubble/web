import thunkMiddleware from 'redux-thunk'
import promiseMiddleware from 'redux-promise'
import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import qs from 'query-string'
import { reducer } from 'utils/createReducer'
import { epics } from 'utils/createEpic'
import isDebug from 'utils/isDebug'
import loggingMiddleware from './logger'

const qp = qs.parse(location.search)
let store

export default function() {
  if (!store) {
    let middleware
    const epicMiddleware = createEpicMiddleware()
    if (isDebug) {
      const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            actionsBlacklist: ['INPUT_CURSOR_SET_POS', 'GAME_SET_CURSOR'],
          })
        : compose
      middleware = composeEnhancers(
        applyMiddleware(epicMiddleware, thunkMiddleware, loggingMiddleware),
      )
    } else {
      middleware = applyMiddleware(epicMiddleware, thunkMiddleware)
    }

    store = createStore(reducer, middleware)

    epicMiddleware.run(epics())
  }
  return store
}
