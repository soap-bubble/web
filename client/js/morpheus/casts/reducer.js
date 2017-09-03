import createReducer from 'utils/createReducer';
import * as castModules from './modules';
import castSelectors from './selectors';

import {
  merge,
} from 'lodash';
import {
  LOADING,
  ENTERING,
  EXITING,
  ENTER,
  ON_STAGE,
} from './actionTypes';

const reducer = createReducer('casts', {
  cache: {},
}, {
  [LOADING](state, { payload: scene }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          status: 'loading',
        },
      },
    };
  },
  [ENTER](state, { payload: scene }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...state.cache[scene.sceneId],
          status: 'loaded',
        },
      },
    };
  },
  [ENTERING](state, { payload: castData, meta: { type: castType, scene } }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...state.cache[scene.sceneId],
          status: 'entering',
          [castType]: castData,
        },
      },
    };
  },
  [ON_STAGE](state, { payload: castData, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : null;
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status: 'onStage',
          [castType]: oldSceneCache ? merge({
            ...oldSceneCache[castType],
          }, castData) : castData,
        },
      },
    };
  },
  [EXITING](state, { payload: castData, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : null;
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status: 'exiting',
          [castType]: oldSceneCache ? merge({
            ...oldSceneCache[castType],
          }, castData) : castData,
        },
      },
    };
  },
});

export default reducer;
