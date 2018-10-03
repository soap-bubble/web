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
  UNLOADING,
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
    };
  };
}


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
  [ENTERING]: withStatus(ENTERING),
  [ON_MOUNT]: withStatus(ON_MOUNT),
  [EXITING]: withStatus(EXITING),
  [UNLOADING]: withStatus(UNLOADING),
  [EXITING]: withStatus(EXITING),
});

export default reducer;
