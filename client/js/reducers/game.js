import createReducer from './createReducer';
import {
  GAME_SET_VOLUME,
} from '../actions/types';

const reducer = createReducer({
  volume: 1,
}, {
  [GAME_SET_VOLUME](game, { payload: volume }) {
    return {
      ...game,
      volume,
    };
  },
});

export default reducer;
