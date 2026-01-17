import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const NUM_OF_DRUMS = 8;
let numOfBeats = 0;
let lastHotspotId: number | null = null;
let lastDrum = -1;

export const id = 1007;

function reset() {
  numOfBeats = 0;
  lastHotspotId = null;
  lastDrum = -1;
}

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, _gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);

  if (lastHotspotId === hotspot.castId) {
    return result;
  }
  lastHotspotId = hotspot.castId;

  const currentDrum = hotspot.param3 - 1;
  if (lastDrum === -1 || currentDrum === (lastDrum + 1) % NUM_OF_DRUMS) {
    lastDrum = currentDrum;
  } else {
    return result;
  }

  numOfBeats += 1;
  result.gamestateUpdates.push({
    stateId: hotspot.param1,
    value: hotspot.param3,
  });

  if (numOfBeats > NUM_OF_DRUMS + NUM_OF_DRUMS / 2) {
    if (hotspot.param2 !== 0) {
      reset();
      result.sceneTransition = {
        sceneId: hotspot.param2,
        dissolve: true,
      };
    }
  }

  return result;
}
