import Immutable from 'immutable';
import createReducer from 'utils/createReducer';
import {
  isUndefined,
} from 'lodash';
import {
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_ENTER_DONE,
  SET_NEXT_START_ANGLE,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_LOAD_ERROR,
} from './actionTypes';

const defaultState = Immutable.fromJS({
  cache: {},
  backgroundScene: null,
  loadedScenes: [],
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
  [SCENE_LOAD_ERROR](state, { payload: sceneId }) {
    if (!state.getIn(['cache', sceneId])) {
      return state.delete(['cache', sceneId]);
    }
    return state;
  },
  [SCENE_LOAD_COMPLETE](state, { payload: scene }) {
    return state.setIn(['cache', scene.sceneId], {
      data: scene,
      status: 'loaded',
    })
      .setIn(['loadedScenes'], state.getIn(['loadedScenes']).push(scene));
  },
  [SCENE_SET_BACKGROUND_SCENE](state, { payload: scene }) {
    return state.set('backgroundScene', scene);
  },
  [SCENE_DO_ENTERING](state, { payload: {
    currentScene,
    currentScenes,
    previousScene,
  } }) {
    return state.withMutations((s: any) =>
      s.set('status', 'entering')
        .set('previousScene', previousScene)
        .set('currentScene', currentScene)
        .set('currentScenes', currentScenes),
    );
  },
  [SCENE_DO_EXITING](state, { payload: { dissolve } }) {
    return state
      .set('status', 'exiting')
      .set('dissolve', isUndefined(dissolve) || !!dissolve);
  },
  [SCENE_ENTER_DONE](state) {
    return state
      .set('status', 'live');
  },
});

export default reducer;
