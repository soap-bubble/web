import createReducer from './createReducer';
import {
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
} from '../actions/types';

const reducer = createReducer({
  volume: 1,
  cursor: 'crosshair',
}, {
  [GAME_SET_VOLUME](game, { payload: volume }) {
    return {
      ...game,
      volume,
    };
  },
  [GAME_SET_CURSOR](game, { payload: morpheusCursor }) {
    let cursor;
    switch(morpheusCursor) {
      case 10002:
        cursor = 'pointer';
        break;
      case 10005:
        cursor = 'alias';
        break;
      case 10008:
        cursor = 'grab';
        break;
      case 10009:
        cursor = 'grabbing';
        break;
      default:
        cursor = 'move';
    }

    return {
      ...game,
      cursor,
    };
  },
});

export default reducer;
