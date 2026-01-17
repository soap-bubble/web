import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const MARACAS_MSC = 2100;
const GONG_MSC = 2106;
const DRUMS_MSC = 2107;
const CASTINET_MSC = 2108;
const PUNJI_MSC = 2109;
const MANDOLIN_MSC = 2099;

export const id = 1009;

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, _gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  let instrumentTest1 = 0;
  let instrumentTest2 = 0;
  let instrumentTest3 = 0;
  let instrumentTest4 = 0;
  let instrumentTest5 = 0;
  let instrumentTest6 = 0;

  if (hotspot.param2 === 1) {
    if (hotspot.param1 === GONG_MSC) {
      instrumentTest1 = 1;
    }
    if (hotspot.param1 === DRUMS_MSC) {
      instrumentTest2 = 1;
    }
    if (hotspot.param1 === MARACAS_MSC) {
      instrumentTest3 = 1;
    }
    if (hotspot.param1 === MANDOLIN_MSC) {
      instrumentTest4 = 1;
    }
    if (hotspot.param1 === PUNJI_MSC) {
      instrumentTest5 = 1;
    }
    if (hotspot.param1 === CASTINET_MSC) {
      instrumentTest6 = 1;
    }
  }

  result.gamestateUpdates.push({ stateId: GONG_MSC, value: instrumentTest1 });
  result.gamestateUpdates.push({ stateId: DRUMS_MSC, value: instrumentTest2 });
  result.gamestateUpdates.push({ stateId: MARACAS_MSC, value: instrumentTest3 });
  result.gamestateUpdates.push({ stateId: MANDOLIN_MSC, value: instrumentTest4 });
  result.gamestateUpdates.push({ stateId: PUNJI_MSC, value: instrumentTest5 });
  result.gamestateUpdates.push({ stateId: CASTINET_MSC, value: instrumentTest6 });

  return result;
}
