import createReducer from 'utils/createReducer'
import { isUndefined } from 'lodash'
import type { Scene } from 'morpheus/casts/types'
import type { AnyAction } from 'redux'
import {
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_ENTER_DONE,
  SET_NEXT_START_ANGLE,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_LOAD_ERROR,
} from './actionTypes'

type SceneState = {
  loading: number | null
  backgroundScene: Scene | null
  loadedScenes: Scene[]
  currentScenes: Scene[]
  currentScene: Scene | null
  previousScene: Scene | null
  status: string
  nextStartAngle: number
  dissolve?: boolean
}

type ScenePayloadAction = AnyAction & { payload?: unknown }

const defaultState: SceneState = {
  loading: null,
  backgroundScene: null,
  loadedScenes: [],
  currentScenes: [],
  currentScene: null,
  previousScene: null,
  status: 'null',
  nextStartAngle: 0,
}

const reducer = createReducer('scene', defaultState, {
  reset() {
    return defaultState
  },
  [SET_NEXT_START_ANGLE](state: SceneState, action: ScenePayloadAction) {
    const nextStartAngle = action.payload as number
    return {
      ...state,
      nextStartAngle,
    }
  },
  [SCENE_LOAD_START](state: SceneState, action: ScenePayloadAction) {
    const sceneId = action.payload as number
    return {
      ...state,
      loading: sceneId,
    }
  },
  [SCENE_LOAD_ERROR](state: SceneState) {
    // TODO
    return state
  },
  [SCENE_LOAD_COMPLETE](state: SceneState, action: ScenePayloadAction) {
    const scene = action.payload as Scene
    return {
      ...state,
      loadedScenes: [...state.loadedScenes, scene],
    }
  },
  [SCENE_SET_BACKGROUND_SCENE](state: SceneState, action: ScenePayloadAction) {
    const scene = action.payload as Scene
    return {
      ...state,
      backgroundScene: scene,
    }
  },
  [SCENE_DO_ENTERING](state: SceneState, action: ScenePayloadAction) {
    const { currentScene, currentScenes, previousScene } = (action.payload ||
      {}) as {
      currentScene: Scene
      currentScenes: Scene[]
      previousScene: Scene | null
    }
    return {
      ...state,
      status: 'entering',
      previousScene,
      currentScene,
      currentScenes,
    }
  },
  [SCENE_DO_EXITING](state: SceneState, action: ScenePayloadAction) {
    const { dissolve } = (action.payload || {}) as { dissolve?: boolean }
    return {
      ...state,
      status: 'exiting',
      dissolve: isUndefined(dissolve) || !!dissolve,
    }
  },
  [SCENE_ENTER_DONE](state: SceneState) {
    return {
      ...state,
      status: 'live',
    }
  },
})

export default reducer
