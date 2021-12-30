import { isUndefined } from "lodash";
// @ts-ignore
import { fetchInitial as fetchInitialGameState } from "service/gameState";
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from "morpheus/scene";
import { selectors as gamestateSelectors, isActive } from "morpheus/gamestate";
import { actions as gameActions } from "morpheus/game";
// @ts-ignore
import scripts from "morpheus/gamestate/scripts";
import {
  actions as castActions,
  selectors as castSelectors,
} from "morpheus/casts";
import loggerFactory from "utils/logger";
import { API_ERROR, LOAD_COMPLETE, UPDATE, INJECT } from "./actionTypes";
import { ACTION_TYPES } from "../constants";
import { ActionCreator, Action } from "redux";
import { ThunkAction } from "redux-thunk";
import { MovieSpecialCast } from "morpheus/casts/types";

const logger = loggerFactory("gamestate:actions");

export function inject(gamestates: any) {
  return {
    type: INJECT,
    payload: gamestates,
  };
}

export function gameStateLoadComplete(responseData: any) {
  return {
    type: LOAD_COMPLETE,
    payload: responseData,
  };
}

export const fetchInitial: ActionCreator<
  ThunkAction<Promise<unknown>, any, any, Action>
> = () => {
  return (dispatch) =>
    fetchInitialGameState()
      .then((responseData: any) =>
        dispatch(gameStateLoadComplete(responseData))
      )
      .catch((err: any) => dispatch({ payload: err, type: API_ERROR }));
};

export function updateGameState(gamestateId: number, value: number) {
  return {
    type: UPDATE,
    payload: value,
    meta: gamestateId,
  };
}

function nextSceneAngle(hotspot: MovieSpecialCast) {
  const { nextSceneId, angleAtEnd } = hotspot;
  let startAngle;
  if (nextSceneId && nextSceneId !== 0x3fffffff) {
    if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
      startAngle = (angleAtEnd * Math.PI) / 1800;
      startAngle -= Math.PI - Math.PI / 6;
    }
  }
  return startAngle;
}

export const handleHotspot: ActionCreator<
  ThunkAction<Promise<boolean>, any, any, Action>
> = ({
  hotspot,
  currentPosition,
  startingPosition,
  isMouseDown,
  context = {},
}: any) => {
  return async (dispatch, getState) => {
    const gamestates = gamestateSelectors.forState(getState());
    const { type, dissolveToNextScene, defaultPass } = hotspot;

    let allDone = !defaultPass;

    const actionType = (context.actionType = ACTION_TYPES[type]);
    switch (actionType) {
      case "GoBack": {
        const prevSceneId = sceneSelectors.previousSceneId(getState());
        const nAngle = (context.nAngle = nextSceneAngle(hotspot));
        if (nAngle) {
          dispatch(sceneActions.setNextStartAngle(nAngle));
        }
        const currentSceneId = sceneSelectors.currentSceneId(getState());
        logger.info(
          `From GoBack at ${currentSceneId} requesting next scene ${prevSceneId}`
        );
        context.nextSceneSpread = [prevSceneId];
        // await dispatch(sceneActions.goToScene(prevSceneId));
        break;
      }
      case "DissolveTo": {
        const { param1: nextSceneId } = hotspot;
        context.nextSceneId = nextSceneId;
        const nAngle = (context.nAngle = nextSceneAngle(hotspot));
        if (nAngle) {
          dispatch(sceneActions.setNextStartAngle(nAngle));
        }
        if (nextSceneId) {
          const currentSceneId = sceneSelectors.currentSceneId(getState());
          logger.info(
            `From DissolveTo at ${currentSceneId} requesting next scene ${nextSceneId}`
          );
          context.nextSceneSpread = [nextSceneId];
        }

        //await dispatch(sceneActions.goToScene(nextSceneId), true);
        break;
      }
      case "ChangeScene": {
        const { param1: nextSceneId } = hotspot;
        context.nextSceneId = nextSceneId;
        if (nextSceneId) {
          const nAngle = (context.nAngle = nextSceneAngle(hotspot));
          if (nAngle) {
            dispatch(sceneActions.setNextStartAngle(nAngle));
          }
          const currentSceneId = sceneSelectors.currentSceneId(getState());
          logger.info(
            `From ChangeScene at ${currentSceneId} requesting next scene ${nextSceneId}`
          );
          context.nextSceneSpread = [nextSceneId, dissolveToNextScene];
          // await dispatch(sceneActions.goToScene(nextSceneId), dissolveToNextScene);
        }
        break;
      }
      case "Rotate": {
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
        const { maxValue, minValue } = gs;
        let { value } = gs;
        const centerX = (rectRight + rectLeft) / 2;
        const centerY = (rectBottom + rectTop) / 2;
        let angle = Math.atan2(
          currentPosition.left - centerX,
          centerY - currentPosition.top
        );
        angle = (180 * angle) / Math.PI - param2;
        while (angle < 0) {
          angle += 360;
        }

        if (angle > param3 - param2) {
          angle = 360 - angle > angle - param3 ? param3 - param2 : 0;
        }

        const currAngle =
          (param3 - param2) * ((value - minValue) / (maxValue - minValue));
        context.currAngle = currAngle;
        if (angle - currAngle < 90 && angle - currAngle > -90) {
          const ratio = (context.ratio = angle / (param3 - param2));
          value = context.value =
            minValue + (maxValue - minValue) * ratio + 0.5;
          context.param1 = param1;
          logger.info(`Rotate ${param1} gamestate to ${value}`);
          dispatch(updateGameState(param1, Math.floor(value)));
        }
        break;
      }
      case "IncrementState": {
        const { param1: gamestateId } = hotspot;
        const gs = gamestates.byId(gamestateId);
        const { maxValue, minValue, stateWraps } = gs;
        let { value } = gs;
        value += 1;
        if (value > maxValue) {
          if (stateWraps) {
            value = minValue;
          } else {
            value = maxValue;
          }
        }
        logger.info(`Increment ${gamestateId} gamestate to ${value}`);
        dispatch(updateGameState(gamestateId, value));
        break;
      }
      case "DecrementState": {
        const { param1: gamestateId } = hotspot;
        const gs = gamestates.byId(gamestateId);
        const { maxValue, minValue, stateWraps } = gs;
        let { value } = gs;
        value -= 1;
        if (value < minValue) {
          if (stateWraps) {
            value = maxValue;
          } else {
            value = minValue;
          }
        }
        logger.info(`Decrement ${gamestateId} gamestate to ${value}`);
        dispatch(updateGameState(gamestateId, value));
        break;
      }
      case "SetStateTo": {
        const { param1: gamestateId, param2: value } = hotspot;
        if (gamestates.byId(gamestateId).value !== value) {
          logger.info(`SetStateTo ${gamestateId} gamestate to ${value}`);
          dispatch(updateGameState(gamestateId, value));
        }
        break;
      }
      case "ExchangeState": {
        const { param1: id1, param2: id2 } = hotspot;
        const { value: value1 } = gamestates.byId(id1);
        const { value: value2 } = gamestates.byId(id2);
        logger.info(
          `Exchange ${id1} gamestate with ${id2} (${value1} <=> ${value2})`
        );
        dispatch(updateGameState(id2, value1));
        dispatch(updateGameState(id1, value2));
        break;
      }
      case "CopyState": {
        const { param1: sourceId, param2: targetId } = hotspot;
        const { value: source } = gamestates.byId(sourceId);
        if (
          gamestates.byId(targetId).value !== gamestates.byId(sourceId).value
        ) {
          logger.info(
            `CopyState ${sourceId} gamestate to ${targetId} with value ${source}`
          );
          dispatch(updateGameState(targetId, source));
        }
        break;
      }
      case "TwoAxisSlider": {
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
          (maxVert - 1) *
            ((vertPos - hotspot.rectTop) /
              (hotspot.rectBottom - hotspot.rectTop))
        );
        const horizontalRatio =
          maxHor *
          ((horizPos - hotspot.rectLeft) /
            (hotspot.rectRight - hotspot.rectLeft));

        if (gs && maxVert && maxHor) {
          const value = Math.floor(maxVert * verticalRatio + horizontalRatio);
          if (gamestates.byId(hotspot.param1).value !== value) {
            logger.info(
              `TwoAxisSlider ${hotspot.param1} gamestate to ${value}`
            );
            dispatch(updateGameState(hotspot.param1, value));
          }
        }
        break;
      }
      case "VertSlider": {
        const { oldValue } = hotspot;
        const gs = gamestates.byId(hotspot.param1);
        let rate = hotspot.param2;
        const { maxValue: max, minValue: min, stateWraps } = gs;
        const ratio =
          (currentPosition.top - startingPosition.top) /
          (hotspot.rectBottom - hotspot.rectTop);
        if (rate === 0) {
          rate = max - min;
        }
        const delta = Math.round(rate * ratio * 2 - 0.5);
        let vertValue =
          (typeof oldValue === "undefined" ? gs.value : oldValue) + delta;
        if (vertValue < min) {
          if (stateWraps) {
            vertValue += max - min;
          } else {
            vertValue = min;
          }
        }
        if (vertValue > max) {
          if (stateWraps) {
            vertValue -= max - min;
          } else {
            vertValue = max;
          }
        }
        const value = Math.floor(vertValue);
        if (gamestates.byId(hotspot.param1).value !== value) {
          logger.info(`VerticalSlider ${hotspot.param1} gamestate to ${value}`);
          dispatch(updateGameState(hotspot.param1, value));
        }
        break;
      }
      case "HorizSlider": {
        const { param1, param2, oldValue } = hotspot;
        let rate = param2;
        const gs = gamestates.byId(param1);
        const { maxValue: max, minValue: min, stateWraps } = gs;
        const ratio =
          (currentPosition.left - startingPosition.left) /
          (hotspot.rectRight - hotspot.rectLeft);
        if (rate === 0) {
          rate = max - min;
        }
        const delta = Math.round(rate * ratio + 0.5);
        let horzValue =
          (typeof oldValue === "undefined" ? gs.value : oldValue) + delta;
        if (horzValue < min) {
          if (stateWraps) {
            horzValue += max - min;
          } else {
            horzValue = min;
          }
        }
        if (horzValue > max) {
          if (stateWraps) {
            horzValue -= max - min;
          } else {
            horzValue = max;
          }
        }
        const value = Math.floor(horzValue);
        if (gamestates.byId(hotspot.param1).value !== value) {
          logger.info(
            `HorizontalSlider ${hotspot.param1} gamestate to ${value}`
          );
          dispatch(updateGameState(hotspot.param1, value));
        }
        break;
      }
      case "NoAction": {
        logger.info(`NoAction`);
        break;
      }

      default: {
        const script = scripts(type);
        if (script) {
          const scriptResult = script.execute(hotspot, gamestates);
          scriptResult &&
            dispatch((dispatch) => {
              scriptResult(dispatch);
              return null;
            });
          break;
        }
        allDone = false;
      }
    }
    return allDone;
  };
};

export const handlePanoHotspot: ActionCreator<
  ThunkAction<Promise<boolean>, any, any, Action>
> = ({
  hotspot,
  currentPosition,
  startingPosition,
  context,
  isMouseDown,
}: any) => {
  return async (dispatch, getState) => {
    if (
      hotspot.param1 !== 0 &&
      (ACTION_TYPES[hotspot.type] === "ChangeScene" ||
        ACTION_TYPES[hotspot.type] === "DissolveTo")
    ) {
      const currentScene = sceneSelectors.currentSceneData(getState());
      if (hotspot.param1) {
        await dispatch(
          castActions.forScene(currentScene).pano.sweepTo(hotspot)
        );
        logger.info(
          `From GoBack at ${currentScene.sceneId} requesting next scene ${hotspot.param1}`
        );
        context.nextSceneSpread = [hotspot.param1, false];
        // await dispatch(sceneActions.goToScene(hotspot.param1, false));
        return !hotspot.defaultPass;
      }
    }
    return await dispatch(
      handleHotspot({
        hotspot,
        currentPosition,
        startingPosition,
        isMouseDown,
        context,
      })
    );
  };
};
