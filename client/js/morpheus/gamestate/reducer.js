import createReducer from 'utils/createReducer';
import {
  UPDATE,
  LOAD_COMPLETE,
} from './actionTypes';

const reducer = createReducer('gamestate', {
  idMap: {},
}, {
  [UPDATE](gamestate, { payload: value, meta: gamestateId }) {
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
  [LOAD_COMPLETE](gamestate, { payload: gamestates }) {
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
