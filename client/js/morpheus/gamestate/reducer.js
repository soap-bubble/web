import createReducer from 'utils/createReducer';
import {
  GAMESTATE_UPDATE,
  GAMESTATE_LOAD_COMPLETE,
} from './actionTypes';

const reducer = createReducer('gamestate', {
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
