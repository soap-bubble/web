import { fetchInitial as fetchInitialGameState } from 'service/gameState';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  selectors as gameStateSelectors,
} from 'morpheus/gamestate';
import {
  actions as gameActions,
} from 'morpheus/game';
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

function isActive({ comparators, gameStates }) {
  return comparators.every(({
    gameStateId,
    testType,
    value,
  }) => {
    const gs = gameStates[gameStateId];

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
  })
}

export function handleMouseOver({ hotspot }) {
  return (dispatch, getState) => {
    const gameStates = gameStateSelectors.gamestates(getState());
    const {
      comparators,
      type,
    } = hotspot;
    if (isActive({ comparators, gameStates })) {
      if (type >= 5 && type <= 8) {
        dispatch(gameActions.setOpenHandCursor());
        return false;
      }
    }
    return true;
  };
}

export function handleMouseDown({ hotspot, top, left}) {
  return (dispatch, getState) => {
    const gameStates = gameStateSelectors.gamestates(getState());
    const {
      comparators,
      type,
    } = hotspot;
    if (isActive({ comparators, gameStates })) {
      if (type >= 5 && type <= 8) {
        const gs = gameStates[hotspot.param1];
        if (gs) {
          gs.oldValue = gs.value;
        }
      }
    }
    return true;
  };
}

export function handleMouseStillDown({ hotspot, top, left }) {
  return (dispatch, getState) => {
    const gameStates = gameStateSelectors.gamestates(getState());
    const {
      comparators,
      type,
    } = hotspot;
    if (isActive({ comparators, gameStates })) {
      const actionType = ACTION_TYPES[type];
      if (actionType === 'VertSlider') {
        dispatch(gameActions.setCloseHandCursor());
        const gs = gameStates[hotspot.param1];
        const { stateWraps, minValue: min, maxValue: max } = gs;
        const oldValue = gs.oldValue || gs.value;
        const ratio = (top - hotspot.rectTop) / (hotspot.rectBottom - hotspot.rectTop);

        gs.value = ratio * max;
        // let rate = hotspot.param2;
        // if (rate === 0) {
        //   rate = max - min;
        // }
        //
        //
        // const delta = rate * ratio - .95;
        // console.log(oldValue, rate, ratio, delta)
        //
        // let value = oldValue + delta;
        // if (value < min) {
        //   if (stateWraps) {
        //     value += max - min;
        //   } else {
        //     value = min;
        //   }
        // }
        // if (value > max) {
        //   if (stateWraps) {
        //     value -= max - min;
        //   } else {
        //     value = max;
        //   }
        // }
        // gs.value = value;
      } else if (actionType === 'HorizSlider') {
        dispatch(gameActions.setCloseHandCursor());
        const gs = gameStates[hotspot.param1];
        const { stateWraps, minValue: min, maxValue: max } = gs;
        const oldValue = gs.oldValue || gs.value;
        const ratio = (left - hotspot.rectLeft) / (hotspot.rectRight - hotspot.rectLeft);
        gs.value = ratio * max;
      }
    }
    return true;
  };
}

export function handleHotspot({ hotspot, top, left }) {
  return (dispatch, getState) => {
    const gameStates = gameStateSelectors.gamestates(getState());
    const {
      comparators,
      type,
    } = hotspot;

    if (isActive({ comparators, gameStates })) {
      const actionType = ACTION_TYPES[type];
      switch(actionType) {
        case 'DissolveTo':
        case 'ChangeScene':
          const { param1: nextSceneId } = hotspot;
          nextSceneId && dispatch(sceneActions.goToScene(nextSceneId));
          return hotspot.defaultPass;
          break;
      }
    }
    return true;
  };
}

window.updateGameState = (gamestateId, value) => {
  store.dispatch(updateGameState(gamestateId, value));
  store.dispatch(castActions.special.update());
};
