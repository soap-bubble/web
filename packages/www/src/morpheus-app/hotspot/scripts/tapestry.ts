import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const TAP_ONE = 2123;
const TAP_FRAME_1 = 2111;
const FRAME_INC = 2122;

export const id = 1000;

function getGamestateId(param1: number): number {
  return TAP_ONE + param1 - 1;
}

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  const tapOnWallState = gamestates.byId(getGamestateId(hotspot.param1));
  result.gamestateUpdates.push({
    stateId: tapOnWallState.stateId,
    value: 0,
  });

  const frameIncVar = gamestates.byId(FRAME_INC);
  const nextFrame = frameIncVar.value;
  result.gamestateUpdates.push({
    stateId: FRAME_INC,
    value: nextFrame + 1,
  });

  const tapFrameVar = gamestates.byId(TAP_FRAME_1 + nextFrame);
  result.gamestateUpdates.push({
    stateId: tapFrameVar.stateId,
    value: hotspot.param1,
  });

  return result;
}
