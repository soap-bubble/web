import type { Hotspot } from 'morpheus/casts/types';
import type { Gamestate } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const LIGHT_IND = 864;
const INFLUXOR_MOVIE_COUNT = 876;
const EFFECT_TRIGGER = 999;

let numOfIngredients = 0;

export const id = 1001;

function incrementState(gs: Gamestate): number {
  const { maxValue, minValue, stateWraps } = gs;
  let { value } = gs;
  value += 1;
  if (value > maxValue) {
    value = stateWraps ? minValue : maxValue;
  }
  return value;
}

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  const indicatorId = LIGHT_IND + (hotspot.param1 - 1);
  const indicator = gamestates.byId(indicatorId);
  const nextIndicatorValue = incrementState(indicator);
  result.gamestateUpdates.push({
    stateId: indicatorId,
    value: nextIndicatorValue,
  });

  const lightOn = nextIndicatorValue === 1;
  numOfIngredients += lightOn ? 1 : -1;

  const effectTrigger = gamestates.byId(EFFECT_TRIGGER);
  result.gamestateUpdates.push({
    stateId: EFFECT_TRIGGER,
    value: incrementState(effectTrigger),
  });

  if (numOfIngredients === 3) {
    numOfIngredients = 0;
    const movieCount = gamestates.byId(INFLUXOR_MOVIE_COUNT);
    result.gamestateUpdates.push({
      stateId: INFLUXOR_MOVIE_COUNT,
      value: incrementState(movieCount),
    });
    result.sceneTransition = {
      sceneId: 306064,
      dissolve: false,
    };
  }

  return result;
}
