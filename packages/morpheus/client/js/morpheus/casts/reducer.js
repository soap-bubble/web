import {
  merge,
} from 'lodash';
import createReducer from 'utils/createReducer';

import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  ON_MOUNT,
} from './actionTypes';

const reducer = createReducer('casts', {
  cache: {},
}, {
  [LOADING](state, { payload: castData, meta: { type: castType, scene } }) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          status: 'loading',
          [castType]: castData,
        },
      },
    };
  },
  [ENTERING](state, { payload: castData = {}, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...state.cache[scene.sceneId],
          status: 'entering',
          [castType]: {
            ...oldSceneCache[castType],
            ...castData,
          },
        },
      },
    };
  },
  [ON_MOUNT](state, { payload: castData = {}, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status: 'onMount',
          [castType]: {
            ...oldSceneCache[castType],
            ...castData,
          },
        },
      },
    };
  },
  [ON_STAGE](state, { payload: castData = {}, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status: 'onStage',
          [castType]: {
            ...oldSceneCache[castType],
            ...castData,
          },
        },
      },
    };
  },
  [EXITING](state, { payload: castData = {}, meta: { type: castType, scene } }) {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status: 'exiting',
          [castType]: {
            ...oldSceneCache[castType],
            ...castData,
          },
        },
      },
    };
  },
});

export default reducer;
