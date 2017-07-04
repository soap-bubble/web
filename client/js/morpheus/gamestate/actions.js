import { fetchInitial as fetchInitialGameState } from 'service/gameState';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import store from 'store';

import {
  API_ERROR,
  LOAD_COMPLETE,
  UPDATE,
  SCENE_END,
} from './actionTypes';
import {
  ACTION_TYPES,
  TEST_TYPES,
} from '../constants';

export function gameStateLoadComplete(responseData) {
  return {
    type: LOAD_COMPLETE,
    payload: responseData,
  };
}

export function fetchInitial() {
  return (dispatch) => fetchInitialGameState()
    .then(responseData => dispatch(gameStateLoadComplete(responseData.data)))
    .catch(err => dispatch({ payload: err, type: API_ERROR }));
}

export function updateGameState(gamestateId, value) {
  return {
    type: UPDATE,
    payload: value,
    meta: gamestateId,
  };
}

export function handleHotspot(hotspot) {
  return (dispatch, getState) => {
    const {
      gameState,
    } = getState();
    const {
      idMap,
    } = gameState;
    const {
      comparators,
      type,
    } = hotspot;

    const isActive = comparators.every(({
      gameStateId,
      testType,
      value,
    }) => {
      const gs = idMap[gameStateId];

      switch(TEST_TYPES[testType]) {
        case 'EqualTo':
          return value === gs.value;
        case 'NotEqualTo':
          return value !== gs.value;
        case 'GreaterThan':
          return value > gs.value;
        case 'LessThan':
          return value < gs.value
        default:
          return false;
      }
    });

    if (isActive) {
      const actionType = ACTION_TYPES[type];
      switch(actionType) {
        case 'ChangeScene':
          const { param1: nextSceneId } = hotspot;
          dispatch({
            type: SCENE_END,
          });
          dispatch(sceneActions.goToScene(nextSceneId));
          break;
      }
    }

  };
}

window.updateGameState = (gamestateId, value) => {
  store.dispatch(updateGameState(gamestateId, value));
  store.dispatch(castActions.special.update());
};
