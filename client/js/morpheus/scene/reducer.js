import createReducer from '../../reducers/createReducer';
import {
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_SET_CURRENT_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_DO_ACTION,
} from './actionTypes';

const reducer = createReducer({
  backgroundScene: null,
  currentScene: null,
  previousScene: null,
  status: 'null',
}, {
  [SCENE_SET_BACKGROUND_SCENE](state, { payload: scene }) {
    return {
      ...state,
      backgroundScene: scene,
    };
  },
  [SCENE_SET_CURRENT_SCENE](state, { payload: scene }) {
    return {
      ...state,
      previousScene: state.currentScene,
      currentScene: scene,
    };
  },
  [SCENE_DO_ENTERING](state) {
    return {
      ...state,
      status: 'entering',
    };
  },
  [SCENE_DO_EXITING](state) {
    return {
      ...state,
      status: 'exiting',
    };
  },
  [SCENE_DO_ACTION](state) {
    return {
      ...state,
      status: 'action',
    };
  },
});

export default reducer;
