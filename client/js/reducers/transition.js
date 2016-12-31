import createReducer from './createReducer';
import {
  TRANSITION_START,
  TRANSITION_END,
} from '../actions/types';

const reducer = createReducer({
  nextSceneId: null,
}, {
  [TRANSITION_START](transition, { payload: nextSceneId }) {
    return {
      ...transition,
      nextSceneId,
    };
  },
  [TRANSITION_END](transition) {
    return {
      ...transition,
      nextSceneId: null,
    };
  },
});

export default reducer;
