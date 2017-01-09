import createReducer from './createReducer';
import {
  TRANSITION_START,
  TRANSITION_END,
} from '../actions/types';

const reducer = createReducer({

}, {
  [TRANSITION_START](transition, { payload: data }) {
    return {
      ...transition,
      data,
    };
  },
  [TRANSITION_END](transition) {
    return {
      ...transition,
      data: null,
    };
  },
});

export default reducer;
