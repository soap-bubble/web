import {
  GAMESTATE_UPDATE,
  GAMESTATE_LOAD_COMPLETE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  idMap: {},
}, {
  [GAMESTATE_UPDATE](gamestate, { payload: value, meta: gamestateId }) {
    const { idMap } = gamestate;
    return {
      ...gamestate,
      idMap: {
        ...idMap,
        [gamestateId]: {
          ...idMap[gamestateId],
          value,
        },
      },
    };
  },
  [GAMESTATE_LOAD_COMPLETE](gamestate, { payload: gamestates }) {
    return {
      ...gamestate,
      idMap: gamestates.reduce((memo, curr) => {
        memo[curr.stateId] = curr;
        return memo;
      }, {}),
    };
  },
});

export default reducer;
