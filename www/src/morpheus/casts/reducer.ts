import { omit } from "lodash";
import createReducer from "utils/createReducer";
import { Scene } from "./types";
import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  UNLOADING,
  UNPRELOAD,
} from "./actionTypes";
import { Action } from "redux";

export type CastActionPayload = {
  payload: { type: String; scene: Scene; castState: any };
};

export type CastActionTypes =
  | typeof PRELOAD
  | typeof LOADING
  | typeof ENTERING
  | typeof EXITING
  | typeof ON_STAGE
  | typeof UNLOADING
  | typeof UNPRELOAD;

export type CastAction = Action<CastActionTypes> & CastActionPayload;

function withStatus(status: string) {
  return (
    state: any,
    { payload: { scene } }: { payload: { scene: Scene } }
  ) => {
    const oldSceneCache = state.cache[scene.sceneId]
      ? state.cache[scene.sceneId]
      : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status,
          // [castType]: {
          //   ...oldSceneCache[castType],
          //   ...castData,
          // },
        },
      },
    };
  };
}

const reducer = createReducer<any, CastAction>(
  "casts",
  {
    cache: {},
  },
  {
    [LOADING]: withStatus(ENTERING),
    [PRELOAD]: withStatus(PRELOAD),
    [ENTERING]: withStatus(ENTERING),
    [EXITING]: withStatus(EXITING),
    [ON_STAGE]: withStatus(ON_STAGE),
    [UNPRELOAD](state, { payload: { scene } }) {
      return {
        ...state,
        cache: omit(state.cache, scene.sceneId),
      };
    },
    [UNLOADING](state, { payload: { scene } }) {
      return {
        ...state,
        cache: omit(state.cache, scene.sceneId),
      };
    },
    [EXITING]: withStatus(EXITING),
  }
);

export default reducer;
