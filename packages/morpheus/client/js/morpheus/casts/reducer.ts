import { omit } from 'lodash'
import type { Action } from 'redux'
import createReducer from 'utils/createReducer'
import { Scene } from './types'
import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  UNLOADING,
  UNPRELOAD,
} from './actionTypes'

type SceneMetaAction = Action<string> & { meta?: { scene?: Scene } }

function withStatus(status: string) {
  return (state: any, action: SceneMetaAction) => {
    const scene = action.meta?.scene
    if (!scene) {
      return state
    }
    const oldSceneCache = state.cache[scene.sceneId]
      ? state.cache[scene.sceneId]
      : {}
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
    }
  }
}

const reducer = createReducer(
  'casts',
  {
    cache: {},
  },
  {
    [LOADING]: withStatus(ENTERING),
    [PRELOAD]: withStatus(PRELOAD),
    [ENTERING]: withStatus(ENTERING),
    [EXITING]: withStatus(EXITING),
    [ON_STAGE]: withStatus(ON_STAGE),
    [UNPRELOAD](state, action: SceneMetaAction) {
      const scene = action.meta?.scene
      if (!scene) {
        return state
      }
      return {
        ...state,
        cache: omit(state.cache, scene.sceneId),
      }
    },
    [UNLOADING](state, action: SceneMetaAction) {
      const scene = action.meta?.scene
      if (!scene) {
        return state
      }
      return {
        ...state,
        cache: omit(state.cache, scene.sceneId),
      }
    },
  }
)

export default reducer
