import createReducer from 'utils/createReducer';
import {
  merge,
} from 'lodash';
import {
  ENTERING,
  EXITING,
  ENTER,
  ON_STAGE,
  EXIT,
} from './actionTypes';

const reducer = createReducer('casts', {
  current: [],
  previous: [],
  background: [],
}, {
  [ENTERING](state, { payload: castData, meta: castType }) {
    return {
      ...state,
      [castType]: castData,
    };
  },
  [ON_STAGE](state, { payload: castData, meta: castType }) {
    return {
      ...state,
      [castType]: merge({
        ...state[castType],
      }, castData),
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
