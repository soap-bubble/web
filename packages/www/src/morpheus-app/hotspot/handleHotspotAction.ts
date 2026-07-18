import { ACTION_TYPES } from 'morpheus/constants';
import type { Hotspot } from 'morpheus/casts/types';
import { transitionAngleToPanoramaYaw } from 'morpheus/scene/transitionAngle';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import { getScript } from '@/morpheus-app/hotspot/scripts';

const TRANSITION_SCENE_SENTINEL = 0x3fffffff;

type Position = { top: number; left: number };

export type HotspotActionResult = {
  gamestateUpdates: Array<{ stateId: number; value: number }>;
  sceneTransition?: {
    sceneId: number;
    dissolve: boolean;
    startAngle?: number;
    mode?: 'goBack';
  };
  preTransitionRotation?: { yaw3600: number; pitch: number };
  allDone: boolean;
};

type HotspotWithAngle = Hotspot & {
  angleAtEnd?: number;
  nextSceneId?: number;
  dissolveToNextScene?: boolean;
};

function normalizeAngle(angle: number): number {
  let next = angle;
  while (next < 0) {
    next += 3600;
  }
  while (next >= 3600) {
    next -= 3600;
  }
  return next;
}

function nextSceneStartAngle(hotspot: HotspotWithAngle): number | undefined {
  if (
    typeof hotspot.nextSceneId === 'number' &&
    hotspot.nextSceneId !== TRANSITION_SCENE_SENTINEL
  ) {
    if (typeof hotspot.angleAtEnd === 'number' && hotspot.angleAtEnd !== -1) {
      return transitionAngleToPanoramaYaw(hotspot.angleAtEnd);
    }
  }
  return undefined;
}

function panoSweepYaw(hotspot: HotspotWithAngle): number {
  // Calculate the center of the hotspot rect in Morpheus coordinates (0-3600)
  // The new system uses yaw3600 directly without the radian conversion offset from legacy
  const left = hotspot.rectLeft;
  const right = hotspot.rectRight > hotspot.rectLeft ? hotspot.rectRight : hotspot.rectRight + 3600;
  const center = left + (right - left) / 2;
  return normalizeAngle(center);
}

export function handleHotspotAction(params: {
  hotspot: HotspotWithAngle;
  gamestates: GamestatesAccessor;
  currentPosition: Position;
  startingPosition: Position;
  previousSceneId?: number;
  isPanoScene: boolean;
  oldValue?: number;
}): HotspotActionResult {
  const {
    hotspot,
    gamestates,
    currentPosition,
    startingPosition,
    previousSceneId,
    isPanoScene,
    oldValue,
  } = params;

  const result: HotspotActionResult = {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };

  const actionType = ACTION_TYPES[hotspot.type];

  if (
    isPanoScene &&
    (actionType === 'ChangeScene' || actionType === 'DissolveTo') &&
    hotspot.param1 !== 0
  ) {
    result.preTransitionRotation = { yaw3600: panoSweepYaw(hotspot), pitch: 0 };
  }

  switch (actionType) {
    case 'GoBack': {
      if (typeof previousSceneId === 'number') {
        result.sceneTransition = {
          sceneId: previousSceneId,
          dissolve: false,
          startAngle: nextSceneStartAngle(hotspot),
          mode: 'goBack',
        };
      }
      break;
    }
    case 'DissolveTo': {
      const nextSceneId = hotspot.param1;
      if (typeof nextSceneId === 'number' && nextSceneId !== 0) {
        result.sceneTransition = {
          sceneId: nextSceneId,
          dissolve: true,
          startAngle: nextSceneStartAngle(hotspot),
        };
      }
      break;
    }
    case 'ChangeScene': {
      const nextSceneId = hotspot.param1;
      if (typeof nextSceneId === 'number' && nextSceneId !== 0) {
        result.sceneTransition = {
          sceneId: nextSceneId,
          dissolve: !!hotspot.dissolveToNextScene,
          startAngle: nextSceneStartAngle(hotspot),
        };
      }
      break;
    }
    case 'Rotate': {
      const gs = gamestates.byId(hotspot.param1);
      const { maxValue, minValue } = gs;
      let value = gs.value;
      const centerX = (hotspot.rectRight + hotspot.rectLeft) / 2;
      const centerY = (hotspot.rectBottom + hotspot.rectTop) / 2;
      let angle = Math.atan2(
        currentPosition.left - centerX,
        centerY - currentPosition.top,
      );
      angle = (180 * angle) / Math.PI - hotspot.param2;
      while (angle < 0) {
        angle += 360;
      }
      if (angle > hotspot.param3 - hotspot.param2) {
        angle = 360 - angle > angle - hotspot.param3 ? hotspot.param3 - hotspot.param2 : 0;
      }
      const currAngle =
        (hotspot.param3 - hotspot.param2) *
        ((value - minValue) / (maxValue - minValue));
      if (angle - currAngle < 90 && angle - currAngle > -90) {
        const ratio = angle / (hotspot.param3 - hotspot.param2);
        value = minValue + (maxValue - minValue) * ratio + 0.5;
        result.gamestateUpdates.push({
          stateId: hotspot.param1,
          value: Math.floor(value),
        });
      }
      break;
    }
    case 'IncrementState': {
      const gs = gamestates.byId(hotspot.param1);
      const { maxValue, minValue, stateWraps } = gs;
      let value = gs.value + 1;
      if (value > maxValue) {
        value = stateWraps ? minValue : maxValue;
      }
      result.gamestateUpdates.push({ stateId: hotspot.param1, value });
      break;
    }
    case 'DecrementState': {
      const gs = gamestates.byId(hotspot.param1);
      const { maxValue, minValue, stateWraps } = gs;
      let value = gs.value - 1;
      if (value < minValue) {
        value = stateWraps ? maxValue : minValue;
      }
      result.gamestateUpdates.push({ stateId: hotspot.param1, value });
      break;
    }
    case 'SetStateTo': {
      const value = hotspot.param2;
      const gs = gamestates.byId(hotspot.param1);
      if (gs.value !== value) {
        console.log('[GamestateUpdate]', hotspot.param1, gs.value, '->', value);
        result.gamestateUpdates.push({ stateId: hotspot.param1, value });
      }
      break;
    }
    case 'ExchangeState': {
      const value1 = gamestates.byId(hotspot.param1).value;
      const value2 = gamestates.byId(hotspot.param2).value;
      result.gamestateUpdates.push({ stateId: hotspot.param2, value: value1 });
      result.gamestateUpdates.push({ stateId: hotspot.param1, value: value2 });
      break;
    }
    case 'CopyState': {
      const source = gamestates.byId(hotspot.param1).value;
      const targetState = gamestates.byId(hotspot.param2);
      if (targetState.value !== source) {
        result.gamestateUpdates.push({
          stateId: hotspot.param2,
          value: source,
        });
      }
      break;
    }
    case 'TwoAxisSlider': {
      // Original formula from legacy actions.ts
      const gs = gamestates.byId(hotspot.param1);
      const maxVert = gamestates.byId(hotspot.param2).maxValue + 1;
      const maxHor = gamestates.byId(hotspot.param3).maxValue;

      // Clamp position to hotspot rect
      let vertPos = currentPosition.top;
      if (currentPosition.top < hotspot.rectTop) {
        vertPos = hotspot.rectTop;
      } else if (currentPosition.top > hotspot.rectBottom) {
        vertPos = hotspot.rectBottom;
      }
      let horizPos = currentPosition.left;
      if (currentPosition.left < hotspot.rectLeft) {
        horizPos = hotspot.rectLeft;
      } else if (currentPosition.left > hotspot.rectRight) {
        horizPos = hotspot.rectRight;
      }

      // Calculate ratios exactly as original
      const verticalRatio = Math.floor(
        (maxVert - 1) *
          ((vertPos - hotspot.rectTop) / (hotspot.rectBottom - hotspot.rectTop)),
      );
      const horizontalRatio =
        maxHor *
        ((horizPos - hotspot.rectLeft) / (hotspot.rectRight - hotspot.rectLeft));

      // Original formula: maxVert * verticalRatio + horizontalRatio
      if (gs && maxVert && maxHor) {
        const value = Math.floor(maxVert * verticalRatio + horizontalRatio);
        if (gs.value !== value) {
          result.gamestateUpdates.push({ stateId: hotspot.param1, value });
        }
      }
      break;
    }
    case 'VertSlider': {
      // Original formula from legacy actions.ts
      const gs = gamestates.byId(hotspot.param1);
      let rate = hotspot.param2;
      const { maxValue: max, minValue: min, stateWraps } = gs;
      const ratio =
        (currentPosition.top - startingPosition.top) /
        (hotspot.rectBottom - hotspot.rectTop);
      if (rate === 0) {
        rate = max - min;
      }
      // Original: Math.round(rate * ratio * 2 - 0.5)
      const delta = Math.round(rate * ratio * 2 - 0.5);
      let vertValue = (oldValue ?? gs.value) + delta;
      if (vertValue < min) {
        vertValue = stateWraps ? vertValue + (max - min) : min;
      }
      if (vertValue > max) {
        vertValue = stateWraps ? vertValue - (max - min) : max;
      }
      const value = Math.floor(vertValue);
      if (gs.value !== value) {
        result.gamestateUpdates.push({ stateId: hotspot.param1, value });
      }
      break;
    }
    case 'HorizSlider': {
      // Original formula from legacy actions.ts
      const gs = gamestates.byId(hotspot.param1);
      let rate = hotspot.param2;
      const { maxValue: max, minValue: min, stateWraps } = gs;
      const ratio =
        (currentPosition.left - startingPosition.left) /
        (hotspot.rectRight - hotspot.rectLeft);
      if (rate === 0) {
        rate = max - min;
      }
      // Original: Math.round(rate * ratio + 0.5)
      const delta = Math.round(rate * ratio + 0.5);
      let horizValue = (oldValue ?? gs.value) + delta;
      if (horizValue < min) {
        horizValue = stateWraps ? horizValue + (max - min) : min;
      }
      if (horizValue > max) {
        horizValue = stateWraps ? horizValue - (max - min) : max;
      }
      const value = Math.floor(horizValue);
      if (gs.value !== value) {
        result.gamestateUpdates.push({ stateId: hotspot.param1, value });
      }
      break;
    }
    case 'NoAction': {
      break;
    }
    default: {
      const script = getScript(hotspot.type);
      if (script) {
        const scriptResult = script.execute(hotspot, gamestates);
        result.gamestateUpdates.push(...scriptResult.gamestateUpdates);
        if (scriptResult.sceneTransition) {
          result.sceneTransition = scriptResult.sceneTransition;
        }
        result.allDone = scriptResult.allDone;
        break;
      }
      result.allDone = false;
      break;
    }
  }

  return result;
}
