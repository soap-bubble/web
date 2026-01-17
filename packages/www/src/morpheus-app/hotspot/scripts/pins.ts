import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const RED_PUSH_PIN = 2458;
const FUSCIA_PUSH_PIN = 2459;
const GREEN_PUSH_PIN = 2460;
const YELLOW_PUSH_PIN = 2461;
const BLUE_PUSH_PIN = 2462;
const AQUA_PUSH_PIN = 2463;

export const id = 1005;

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

function pushPinUpdates(
  updates: Array<{ stateId: number; value: number }>,
  param: number,
  gamestateId: number,
  value: number,
) {
  if (param !== gamestateId) {
    if (value === 1) {
      updates.push({ stateId: gamestateId, value: 0 });
    }
    return;
  }

  if (value !== 2) {
    updates.push({ stateId: gamestateId, value: 1 });
  }
  if (value === 1) {
    updates.push({ stateId: gamestateId, value: 0 });
  }
}

export function execute(hotspot: Hotspot, gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  const { value: pinRed } = gamestates.byId(RED_PUSH_PIN);
  const { value: pinFuscia } = gamestates.byId(FUSCIA_PUSH_PIN);
  const { value: pinGreen } = gamestates.byId(GREEN_PUSH_PIN);
  const { value: pinYellow } = gamestates.byId(YELLOW_PUSH_PIN);
  const { value: pinBlue } = gamestates.byId(BLUE_PUSH_PIN);
  const { value: pinAqua } = gamestates.byId(AQUA_PUSH_PIN);

  pushPinUpdates(result.gamestateUpdates, hotspot.param1, RED_PUSH_PIN, pinRed);
  pushPinUpdates(
    result.gamestateUpdates,
    hotspot.param1,
    FUSCIA_PUSH_PIN,
    pinFuscia,
  );
  pushPinUpdates(
    result.gamestateUpdates,
    hotspot.param1,
    GREEN_PUSH_PIN,
    pinGreen,
  );
  pushPinUpdates(
    result.gamestateUpdates,
    hotspot.param1,
    YELLOW_PUSH_PIN,
    pinYellow,
  );
  pushPinUpdates(
    result.gamestateUpdates,
    hotspot.param1,
    BLUE_PUSH_PIN,
    pinBlue,
  );
  pushPinUpdates(
    result.gamestateUpdates,
    hotspot.param1,
    AQUA_PUSH_PIN,
    pinAqua,
  );

  return result;
}
