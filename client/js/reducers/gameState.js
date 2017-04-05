import {
  GAMESTATE_LOAD_COMPLETE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  idMap: {},
}, {
  [GAMESTATE_LOAD_COMPLETE](gameState, { payload: gameStates }) {
    return {
      ...gameState,
      idMap: gameStates.reduce((memo, curr) => {
        memo[curr.stateId] = curr;
        return memo;
      }, {}),
    };
  },
});

export default reducer;
