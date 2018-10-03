import {
  omit,
} from 'lodash';
import createReducer from 'utils/createReducer';

import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  UNLOADING,
  UNPRELOAD,
} from './actionTypes';

function withStatus(status) {
  return (state, { payload: castData = {}, meta: { type: castType, scene } }) => {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status,
          [castType]: {
            ...oldSceneCache[castType],
            ...castData,
          },
        },
      },
      status: {
        ...state.status,
        [scene.sceneId]: status,
      },
    };
  };
}


const reducer = createReducer('casts', {
  cache: {},
}, {
  [LOADING]: withStatus(ENTERING),
  [PRELOAD]: withStatus(PRELOAD),
  [ENTERING]: withStatus(ENTERING),
  [EXITING]: withStatus(EXITING),
  [ON_STAGE]: withStatus(ON_STAGE),
  [UNPRELOAD](state, { meta: { scene } }) {
    return {
      ...state,
      cache: omit(state.cache, scene.sceneId),
      status: omit(state.status, scene.sceneId),
    };
  },
  [UNLOADING](state, { meta: { scene } }) {
    return {
      ...state,
      cache: omit(state.cache, scene.sceneId),
      status: omit(state.status, scene.sceneId),
    };
  },
  [EXITING]: withStatus(EXITING),
});

export default reducer;
