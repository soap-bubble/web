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
  EXIT,
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
  [ENTERING](state, { payload: castData, meta: { type: castType, scene }}) {
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
  [ON_STAGE](state, { payload: castData, meta: { type: castType, scene }}) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...state.cache[scene.sceneId],
          status: 'onStage',
          [castType]: merge({
            ...state.cache[scene.sceneId][castType],
          }, castData),
        },
      },
    };
  },
  [EXIT](state, { payload: castData, meta: { type: castType, scene }}) {
    return {
      ...state,
      cache: {
        ...state.cache,
        [scene.sceneId]: {
          ...state.cache[scene.sceneId],
          status: 'exiting',
          [castType]: merge({
            ...state.cache[scene.sceneId][castType],
          }, castData),
        },
      },
    };
  },
  // [ENTERING](state) {
  //   return {
  //     ...state,
  //     current: state.current
  //       .map(cast => ({
  //         ...cast,
  //         status: 'onStage',
  //       })),
  //   };
  // },
  // [ENTER](state) {
  //   return {
  //     ...state,
  //     current: state.current.map(cast => ({
  //       ...cast,
  //       mouseWithin: false,
  //       mouseDownOnCast: false,
  //       status: 'entering',
  //     })),
  //   };
  // },
  // [EXIT](state) {
  //   return {
  //     ...state,
  //     current: state.current.map(cast => ({
  //       ...cast,
  //       mouseDownOnCast: false,
  //       status: 'exiting',
  //     })),
  //   };
  // },
  // [EXITING](state) {
  //   return {
  //     ...state,
  //     current: state.current.map(cast => ({
  //       ...cast,
  //       status: 'offStage',
  //     })),
  //   };
  // },
});

export default reducer;
