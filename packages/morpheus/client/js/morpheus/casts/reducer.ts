import {
  omit,
} from 'lodash';
import createReducer from 'utils/createReducer';
import { Scene } from './types'
import {
  PRELOAD,
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  UNLOADING,
  UNPRELOAD,
} from './actionTypes';

function withStatus(status: string) {
  return (state: any, { meta: { scene } }: { meta: { scene: Scene }}) => {
    const oldSceneCache = state.cache[scene.sceneId] ? state.cache[scene.sceneId] : {};
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...oldSceneCache,
          status,
          // [castType]: {
          //   ...oldSceneCache[castType],
          //   ...castData,
          // },
        },
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
    };
  },
  [UNLOADING](state, { meta: { scene } }) {
    return {
      ...state,
      cache: omit(state.cache, scene.sceneId),
    };
  },
  [EXITING]: withStatus(EXITING),
});

export default reducer;
