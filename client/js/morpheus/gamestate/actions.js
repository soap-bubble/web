import { fetchInitial as fetchInitialGameState } from 'service/gameState';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  actions as gameActions,
} from 'morpheus/game';
import scripts from 'morpheus/gamestate/scripts';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  API_ERROR,
  LOAD_COMPLETE,
  UPDATE,
  INJECT,
} from './actionTypes';
import {
  ACTION_TYPES,
  GESTURES,
} from '../constants';

export function inject(gamestates) {
  return {
    type: INJECT,
    payload: gamestates,
  };
}

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

export function handleHotspot({ hotspot, currentPosition, startingPosition }) {
  return async (dispatch, getState) => {
    const gamestates = gamestateSelectors.forState(getState());
    const {
      type,
      dissolveToNextScene,
      defaultPass,
    } = hotspot;

    let allDone = !defaultPass;

    const actionType = ACTION_TYPES[type];
    switch (actionType) {
      case 'GoBack': {
        const prevSceneId = sceneSelectors.previousSceneId(getState());
        await dispatch(sceneActions.goToScene(prevSceneId));
        break;
      }
      case 'DissolveTo': {
        const { param1: nextSceneId } = hotspot;
        if (nextSceneId) await dispatch(sceneActions.goToScene(nextSceneId), true);
        break;
      }
      case 'ChangeScene': {
        const { param1: nextSceneId } = hotspot;
        if (nextSceneId) await dispatch(sceneActions.goToScene(nextSceneId), dissolveToNextScene);
        break;
      }
      case 'IncrementState': {
        const { param1: gamestateId } = hotspot;
        const gs = gamestates.byId(gamestateId);
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
        break;
      }
      case 'DecrementState': {
        const { param1: gamestateId } = hotspot;
        const gs = gamestates.byId(gamestateId);
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
        break;
      }
      case 'SetStateTo': {
        const { param1: gamestateId, param2: value } = hotspot;
        dispatch(updateGameState(gamestateId, value));
        break;
      }
      case 'ExchangeState': {
        const { param1: id1, param2: id2 } = hotspot;
        const { value: value1 } = gamestates.byId(id1);
        const { value: value2 } = gamestates.byId(id2);
        dispatch(updateGameState(id2, value1));
        dispatch(updateGameState(id1, value2));
        break;
      }
      case 'CopyState': {
        const { param1: sourceId, param2: targetId } = hotspot;
        const { value: source } = gamestates.byId(sourceId);
        dispatch(updateGameState(targetId, source));
        break;
      }
      case 'TwoAxisSlider': {
        const gs = gamestates.byId(hotspot.param1);
        const { maxValue: vertFromState } = gamestates.byId(hotspot.param2);
        const { maxValue: horFromState } = gamestates.byId(hotspot.param3);
        const maxVert = vertFromState + 1;
        const maxHor = horFromState + 1;
        const verticalRatio = Math.floor(
          maxVert * ((currentPosition.top - hotspot.rectTop) /
            (hotspot.rectBottom - hotspot.rectTop)),
        );
        const horizontalRatio = Math.floor(
          maxHor * ((currentPosition.left - hotspot.rectLeft) /
            (hotspot.rectRight - hotspot.rectLeft)),
        );

        if (gs && maxVert && maxHor) {
          const value = (maxVert * verticalRatio) + horizontalRatio;
          dispatch(updateGameState(hotspot.param1, Math.round(value)));
        }
        break;
      }
      case 'VertSlider': {
        const gs = gamestates.byId(hotspot.param1);
        let rate = hotspot.param2;
        const { maxValue: max, minValue: min, stateWraps } = gs;
        const ratio = (currentPosition.top - startingPosition.top) /
          (hotspot.rectBottom - hotspot.rectTop);
        if (rate === 0) {
          rate = max - min;
        }
        const delta = Math.round((rate * ratio) - 0.5);
        let value = hotspot.oldValue + delta;
        if (value < min) {
          if (stateWraps) {
            value += max - min;
          } else {
            value = min;
          }
        }
        if (value > max) {
          if (stateWraps) {
            value -= max - min;
          } else {
            value = max;
          }
        }
        dispatch(updateGameState(hotspot.param1, Math.round(value)));
        break;
      }
      case 'HorizSlider': {
        const { param1, param2, oldValue } = hotspot;
        let rate = param2;
        const gs = gamestates.byId(param1);
        const { maxValue: max, minValue: min, stateWraps } = gs;
        const ratio = (currentPosition.left - startingPosition.left) /
          (hotspot.rectRight - hotspot.rectLeft);
        if (rate === 0) {
          rate = max - min;
        }
        const delta = Math.round((rate * ratio) + 0.5);
        let value = oldValue + delta;
        if (value < min) {
          if (stateWraps) {
            value += max - min;
          } else {
            value = min;
          }
        }
        if (value > max) {
          if (stateWraps) {
            value -= max - min;
          } else {
            value = max;
          }
        }
        dispatch(updateGameState(param1, Math.round(value)));
        break;
      }
      case 'Rotate':
      case 'NoAction': {
        break;
      }

      default: {
        const script = scripts(type);
        if (script) {
          dispatch(script.execute(hotspot, gamestates));
          break;
        }
        allDone = false;
      }
    }
    return allDone;
  };
}

export function handlePanoHotspot({ hotspot, currentPosition, startingPosition }) {
  return async (dispatch, getState) => {
    const currentScene = sceneSelectors.currentSceneData(getState());
    const scene3D = castSelectors.forScene(currentScene).hotspot.scene3D(getState());
    dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
    if (ACTION_TYPES[hotspot.type] === 'ChangeScene') {
      if (hotspot.param1) {
        await dispatch(castActions.forScene(currentScene).pano.sweepTo(hotspot));
        return await dispatch(sceneActions.goToScene(hotspot.param1, false));
      }
    }
    return await dispatch(handleHotspot({ hotspot, currentPosition, startingPosition }));
  };
}
