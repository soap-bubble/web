import {
  DIMENSIONS_RESIZE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  width: 800,
  height: 480,
}, {
  [DIMENSIONS_RESIZE](windowState, { payload }) {
    const { width, height } = payload;
    return {
      ...windowState,
      width,
      height,
    };
  },
});

export default reducer;
