import createReducer from 'utils/createReducer'
import { isUndefined } from 'lodash'
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

const defaultState = {
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
  [SET_NEXT_START_ANGLE](state, { payload: nextStartAngle }) {
    return {
      ...state,
      nextStartAngle,
    }
  },
  [SCENE_LOAD_START](state, { payload: sceneId }) {
    return {
      ...state,
      loading: sceneId,
    }
  },
  [SCENE_LOAD_ERROR](state, { payload: sceneId }) {
    // TODO
    return state
  },
  [SCENE_LOAD_COMPLETE](state, { payload: scene }) {
    return {
      ...state,
      loadedScenes: [...state.loadedScenes, scene],
    }
  },
  [SCENE_SET_BACKGROUND_SCENE](state, { payload: scene }) {
    return {
      ...state,
      backgroundScene: scene,
    }
  },
  [SCENE_DO_ENTERING](
    state,
    { payload: { currentScene, currentScenes, previousScene } }
  ) {
    return {
      ...state,
      status: 'entering',
      previousScene,
      currentScene,
      currentScenes,
    }
  },
  [SCENE_DO_EXITING](state, { payload: { dissolve } }) {
    return {
      ...state,
      status: 'exiting',
      dissolve: isUndefined(dissolve) || !!dissolve,
    }
  },
  [SCENE_ENTER_DONE](state) {
    return {
      ...state,
      status: 'live',
    }
  },
})

export default reducer
