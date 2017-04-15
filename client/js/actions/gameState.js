import store from '../store';
import { fetchInitial as fetchInitialGameState } from '../service/gameState';
import {
  generateControlledFrames,
  generateSpecialImages,
} from './special';
import {
  API_ERROR,
  GAMESTATE_LOAD_COMPLETE,
  GAMESTATE_UPDATE,
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

export function updateGameState(gamestateId, value) {
  return {
    type: GAMESTATE_UPDATE,
    payload: value,
    meta: gamestateId,
  };
}

window.updateGameState = (gamestateId, value) => {
  store.dispatch(updateGameState(gamestateId, value));
  store.dispatch(generateControlledFrames());
  store.dispatch(generateSpecialImages());
};
