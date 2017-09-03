import Immutable from 'immutable';
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

const CURRENT_SCENE_STACK_SIZE = 3;
const defaultState = Immutable.fromJS({
  cache: {},
  backgroundScene: null,
  currentScenes: [],
  currentScene: null,
  previousScene: null,
  status: 'null',
  nextStartAngle: 0,
});

const reducer = createReducer('scene', defaultState, {
  reset() {
    return defaultState;
  },
  [SET_NEXT_START_ANGLE](state, { payload: nextStartAngle }) {
    if (!isUndefined(nextStartAngle)) {
      return state.set('nextStartAngle', nextStartAngle);
    }
    return state;
  },
  [SCENE_LOAD_START](state, { payload: sceneId }) {
    if (!state.getIn(['cache', sceneId])) {
      return state.setIn(['cache', sceneId], {
        status: 'loading',
      });
    }
    return state;
  },
  [SCENE_LOAD_COMPLETE](state, { payload: scene }) {
    return state.setIn(['cache', scene.sceneId], {
      data: scene,
      status: 'loaded',
    });
  },
  [SCENE_SET_BACKGROUND_SCENE](state, { payload: scene }) {
    return state.set('backgroundScene', scene);
  },
  [SCENE_DO_ENTERING](state, { payload: scene }) {
    let currentScenes = state.get('currentScenes');
    // Check if scene is already in scene stack
    const existingScene = currentScenes.find(s => s.sceneId === scene.sceneId);
    if (existingScene) {
      // Promote existing scene to top...
      currentScenes = currentScenes.remove(currentScenes.indexOf(existingScene));
    } else if (currentScenes.count() === CURRENT_SCENE_STACK_SIZE) {
      currentScenes = currentScenes.pop();
    }
    currentScenes = currentScenes.unshift(scene);
    return state.withMutations(s =>
      s.set('status', 'entering')
        .set('previousScene', state.get('currentScene'))
        .set('currentScene', scene)
        .set('currentScenes', currentScenes),
    );
  },
  [SCENE_DO_EXITING](state, { dissolve }) {
    return state
      .set('status', 'exiting')
      .set('dissolve', isUndefined(dissolve) || !!dissolve);
  },
  [SCENE_DO_ENTER](state) {
    return state
      .set('status', 'live');
  },
});

export default reducer;
