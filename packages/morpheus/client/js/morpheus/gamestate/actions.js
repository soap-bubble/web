import {
  isUndefined,
} from 'lodash';
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

function nextSceneAngle(hotspot) {
  const {
    nextSceneId,
    angleAtEnd,
  } = hotspot;
  let startAngle;
  if (nextSceneId && nextSceneId !== 0x3FFFFFFF) {
    if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
      startAngle = (angleAtEnd * Math.PI) / 1800;
      startAngle -= Math.PI - (Math.PI / 6);
    }
  }
  return startAngle;
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
        const nAngle = nextSceneAngle(hotspot);
        if (nAngle) {
          dispatch(sceneActions.setNextStartAngle(nAngle));
        }
        await dispatch(sceneActions.goToScene(prevSceneId));
        break;
      }
      case 'DissolveTo': {
        const { param1: nextSceneId } = hotspot;
        const nAngle = nextSceneAngle(hotspot);
        if (nAngle) {
          dispatch(sceneActions.setNextStartAngle(nAngle));
        }
        if (nextSceneId) await dispatch(sceneActions.goToScene(nextSceneId), true);
        break;
      }
      case 'ChangeScene': {
        const { param1: nextSceneId } = hotspot;
        if (nextSceneId) {
          const nAngle = nextSceneAngle(hotspot);
          if (nAngle) {
            dispatch(sceneActions.setNextStartAngle(nAngle));
          }
          await dispatch(sceneActions.goToScene(nextSceneId), dissolveToNextScene);
        }
        break;
      }
      case 'Rotate': {
        const {
          param1,
          param2,
          param3,
          rectRight,
          rectLeft,
          rectBottom,
          rectTop,
        } = hotspot;
        const gs = gamestates.byId(param1);
        const {
          maxValue,
          minValue,
        } = gs;
        let {
          value,
        } = gs;
        const centerX = (rectRight + rectLeft) / 2;
        const centerY = (rectBottom + rectTop) / 2;
        let angle = Math.atan2(currentPosition.left - centerX,
                        centerY - currentPosition.top);
        angle = ((180 * angle) / Math.PI) - param2;
        while (angle < 0) {
          angle += 360;
        }

        if (angle > param3 - param2) {
          angle = 360 - angle > angle - param3 ?
                param3 - param2 :
                0;
        }

        const currAngle = (param3 - param2) * ((value - minValue) /
                  (maxValue - minValue));

        if (angle - currAngle < 90 && angle - currAngle > -90) {
          const ratio = angle / (param3 - param2);
          value = minValue + ((maxValue - minValue) * ratio) + 0.5;
          dispatch(updateGameState(param1, Math.floor(value)));
        }
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
        const maxHor = horFromState;
        let vertPos;
        if (currentPosition.top < hotspot.rectTop) {
          vertPos = hotspot.rectTop;
        } else if (currentPosition.top > hotspot.rectBottom) {
          vertPos = hotspot.rectBottom;
        } else {
          vertPos = currentPosition.top;
        }

        let horizPos;
        if (currentPosition.left < hotspot.rectLeft) {
          horizPos = hotspot.rectLeft;
        } else if (currentPosition.left > hotspot.rectRight) {
          horizPos = hotspot.rectRight;
        } else {
          horizPos = currentPosition.left;
        }

        const verticalRatio = Math.floor(
          (maxVert - 1) * ((vertPos - hotspot.rectTop) /
            (hotspot.rectBottom - hotspot.rectTop)),
        );
        const horizontalRatio = maxHor * ((horizPos - hotspot.rectLeft) /
          (hotspot.rectRight - hotspot.rectLeft));

        if (gs && maxVert && maxHor) {
          const value = (maxVert * verticalRatio) + horizontalRatio;
          dispatch(updateGameState(hotspot.param1, Math.floor(value)));
        }
        break;
      }
      case 'VertSlider': {
        const { oldValue } = hotspot;
        const gs = gamestates.byId(hotspot.param1);
        let rate = hotspot.param2;
        const { maxValue: max, minValue: min, stateWraps } = gs;
        const ratio = (currentPosition.top - startingPosition.top) /
          (hotspot.rectBottom - hotspot.rectTop);
        if (rate === 0) {
          rate = max - min;
        }
        const delta = Math.round((rate * ratio * 2) - 0.5);
        let value = (typeof oldValue === 'undefined' ? gs.value : oldValue) + delta;
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
        let value = (typeof oldValue === 'undefined' ? gs.value : oldValue) + delta;
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
    if (scene3D) {
      dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
    }
    if (ACTION_TYPES[hotspot.type] === 'ChangeScene') {
      if (hotspot.param1) {
        await dispatch(castActions.forScene(currentScene).pano.sweepTo(hotspot));
        return await dispatch(sceneActions.goToScene(hotspot.param1, false));
      }
    }
    return await dispatch(handleHotspot({ hotspot, currentPosition, startingPosition }));
  };
}
