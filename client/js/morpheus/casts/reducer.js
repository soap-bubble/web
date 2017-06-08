import createReducer from 'utils/createReducer';
import {
  ENTERING,
  EXITING,
  ENTER,
  EXIT,
} from './actionTypes';

const reducer = createReducer('casts', {
  current: [],
  previous: [],
  background: [],
}, {
  [ENTERING](state) {
    return {
      ...state,
      current: state.current
        .map(cast => ({
          ...cast,
          status: 'onStage',
        })),
    };
  },
  [ENTER](state) {
    return {
      ...state,
      current: state.current.map(cast => ({
        ...cast,
        mouseWithin: false,
        mouseDownOnCast: false,
        status: 'entering',
      })),
    };
  },
  [EXIT](state) {
    return {
      ...state,
      current: state.current.map(cast => ({
        ...cast,
        mouseDownOnCast: false,
        status: 'exiting',
      })),
    };
  },
  [EXITING](state) {
    return {
      ...state,
      current: state.current.map(cast => ({
        ...cast,
        status: 'offStage',
      })),
    };
  },
});

export default reducer;
