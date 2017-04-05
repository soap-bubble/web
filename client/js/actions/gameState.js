import { fetchInitial as fetchInitialGameState } from '../service/gameState';
import {
  API_ERROR,
  GAMESTATE_LOAD_COMPLETE,
} from './types';


export function gameStateLoadComplete(responseData) {
  return {
    type: GAMESTATE_LOAD_COMPLETE,
    payload: responseData,
  };
}

export function fetchInitial() {
  return (dispatch) => {
    fetchInitialGameState()
      .then(responseData => dispatch(gameStateLoadComplete(responseData.data)))
      .catch(err => dispatch({ payload: err, type: API_ERROR }));
  };
}
