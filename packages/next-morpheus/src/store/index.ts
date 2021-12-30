import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware, compose, Store } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { reducer } from "utils/createReducer";
import { epics } from "utils/createEpic";
import isDebug from "utils/isDebug";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

let store: Store;

export default function Index() {
  if (!store) {
    let middleware;
    const epicMiddleware = createEpicMiddleware();
    if (isDebug) {
      const composeEnhancers =
        typeof window !== "undefined" &&
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
          ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
              // @ts-ignore
              actionsBlacklist: ["INPUT_CURSOR_SET_POS", "GAME_SET_CURSOR"],
            })
          : compose;
      middleware = composeEnhancers(
        // @ts-ignore
        applyMiddleware(epicMiddleware, thunkMiddleware)
      );
    } else {
      // @ts-ignore
      middleware = applyMiddleware(epicMiddleware, thunkMiddleware);
    }

    store = createStore(reducer, middleware);

    epicMiddleware.run(epics());
  }
  return store;
}
