import createReducer from 'utils/createReducer';
import {
  isUndefined,
} from 'lodash';
import {
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_DO_ENTER,
  SET_NEXT_START_ANGLE,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
} from './actionTypes';

const reducer = createReducer('scene', {
  cache: {},
  backgroundScene: null,
  currentScene: null,
  previousScene: null,
  status: 'null',
  nextStartAngle: 0,
}, {
  [SET_NEXT_START_ANGLE](state, { payload: nextStartAngle }) {
    if (!isUndefined(nextStartAngle)) {
      return {
        ...state,
        nextStartAngle,
      };
    }
    return state;
  },
  [SCENE_LOAD_START](state, { payload: sceneId }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [sceneId]: {
          status: 'loading',
        },
      },
    };
  },
  [SCENE_LOAD_COMPLETE](state, { payload: scene }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          data: scene,
          status: 'loaded',
        },
      },
    };
  },
  [SCENE_SET_BACKGROUND_SCENE](state, { payload: scene }) {
    return {
      ...state,
      backgroundScene: scene,
    };
  },
  [SCENE_DO_ENTERING](state, { payload: scene }) {
    return {
      ...state,
      status: 'entering',
      previousScene: state.currentScene,
      currentScene: scene,
    };
  },
  [SCENE_DO_EXITING](state, { dissolve }) {
    return {
      ...state,
      status: 'exiting',
      dissolve: isUndefined(dissolve) || !!dissolve,
    };
  },
  [SCENE_DO_ENTER](state) {
    return {
      ...state,
      status: 'live',
    };
  },
});

export default reducer;
