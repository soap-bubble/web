import { fetchInitial as fetchInitialGameState } from 'service/gameState';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameStateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  actions as gameActions,
} from 'morpheus/game';
import store from 'store';

import {
  API_ERROR,
  LOAD_COMPLETE,
  UPDATE,
} from './actionTypes';
import {
  ACTION_TYPES,
} from '../constants';

export function gameStateLoadComplete(responseData) {
  return {
    type: LOAD_COMPLETE,
    payload: responseData,
  };
}

export function fetchInitial() {
  return dispatch => fetchInitialGameState()
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

export function handleMouseOver({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      if (type >= 5 && type <= 8) {
        dispatch(gameActions.setOpenHandCursor());
        return false;
      }
    }
    return true;
  };
}

export function handleMouseDown({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      if (type >= 5 && type <= 8) {
        const gs = gamestates[hotspot.param1];
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
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      const actionType = ACTION_TYPES[type];
      if (actionType === 'VertSlider') {
        dispatch(gameActions.setCloseHandCursor());
        const gs = gamestates[hotspot.param1];
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
        const gs = gamestates[hotspot.param1];
        const { stateWraps, minValue: min, maxValue: max } = gs;
        const oldValue = gs.oldValue || gs.value;
        const ratio = (left - hotspot.rectLeft) / (hotspot.rectRight - hotspot.rectLeft);
        gs.value = ratio * max;
      }
    }
    return true;
  };
}

export function handleHotspot({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;

    if (isActive({ cast: hotspot, gamestates })) {
      const actionType = ACTION_TYPES[type];
      switch (actionType) {
        case 'GoBack': {
          const prevSceneId = sceneSelectors.previousSceneId(getState());
          dispatch(sceneActions.goToScene(prevSceneId));
          break;
        }
        case 'DissolveTo':
        case 'ChangeScene': {
          const { defaultPass, param1: nextSceneId } = hotspot;
          if (nextSceneId) dispatch(sceneActions.goToScene(nextSceneId));
          return defaultPass;
        }
        case 'IncrementState': {
          const { defaultPass, param1: gamestateId } = hotspot;
          const gs = gameStateSelectors.gamestates(getState())[gamestateId];
          const {
            maxValue,
            minValue,
            stateWraps,
          } = gs;
          let { value } = gs;
          value += 1;
          if (value > maxValue) {
            if (stateWraps) {
              value = minValue;
            } else {
              value = maxValue;
            }
          }
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }
        case 'DecrementState': {
          const { defaultPass, param1: gamestateId } = hotspot;
          const gs = gameStateSelectors.gamestates(getState())[gamestateId];
          const {
            maxValue,
            minValue,
            stateWraps,
          } = gs;
          let { value } = gs;
          value -= 1;
          if (value < minValue) {
            if (stateWraps) {
              value = maxValue;
            } else {
              value = minValue;
            }
          }
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }
        case 'SetStateTo': {
          const { defaultPass, param1: gamestateId, param2: value } = hotspot;
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }
        default:
          break;
      }
    }
    return true;
  };
}

window.updategs = (gamestateId, value) => {
  store.dispatch(updateGameState(gamestateId, value));
  store
    .dispatch(
      castActions.forScene(
        sceneSelectors.currentSceneId(
          store.getState(),
        ),
      )
      .special
      .update(),
    );
};

window.getgs = gamestateId => gameStateSelectors.gamestates(store.getState())[gamestateId];
