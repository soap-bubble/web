import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const TUBE_1 = 1041;
const TUBE_2 = 1042;
const TUBE_3 = 1043;
const MB_INST_1 = 1047;
const MB_INST_2 = 1048;
const MB_INST_3 = 1049;
const SONG_LEVER = 1039;

export const id = 1002;

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  const isStart = hotspot.param1;
  if (!isStart) {
    return result;
  }

  const { value: instTest1 } = gamestates.byId(MB_INST_1);
  const { value: instTest2 } = gamestates.byId(MB_INST_2);
  const { value: instTest3 } = gamestates.byId(MB_INST_3);
  let { value: incrementer } = gamestates.byId(SONG_LEVER);

  if (instTest1 === 0) {
    if (incrementer > 9) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_1, value: incrementer + 1 });
  }
  if (instTest1 === 1) {
    if (incrementer > 8) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_1, value: incrementer + 2 });
  }
  if (instTest1 === 2) {
    if (incrementer > 7) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_1, value: incrementer + 3 });
  }
  if (instTest1 === 3) {
    if (incrementer > 6) {
      incrementer = 16 - incrementer;
    }
    if (incrementer > 7) {
      incrementer = 6;
    }
    result.gamestateUpdates.push({ stateId: TUBE_1, value: incrementer + 4 });
  }

  if (instTest2 === 0) {
    if (incrementer > 9) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_2, value: incrementer + 1 });
  }
  if (instTest2 === 1) {
    if (incrementer > 8) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_2, value: incrementer + 2 });
  }
  if (instTest2 === 2) {
    if (incrementer > 7) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_2, value: incrementer + 3 });
  }
  if (instTest2 === 3) {
    if (incrementer > 6) {
      incrementer = 16 - incrementer;
    }
    if (incrementer > 7) {
      incrementer = 6;
    }
    result.gamestateUpdates.push({ stateId: TUBE_2, value: incrementer + 4 });
  }

  if (instTest3 === 0) {
    if (incrementer > 9) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_3, value: incrementer + 1 });
  }
  if (instTest3 === 1) {
    if (incrementer > 8) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_3, value: incrementer + 2 });
  }
  if (instTest3 === 2) {
    if (incrementer > 7) {
      incrementer = 16 - incrementer;
    }
    result.gamestateUpdates.push({ stateId: TUBE_3, value: incrementer + 3 });
  }
  if (instTest3 === 3) {
    if (incrementer > 6) {
      incrementer = 16 - incrementer;
    }
    if (incrementer > 7) {
      incrementer = 6;
    }
    result.gamestateUpdates.push({ stateId: TUBE_3, value: incrementer + 4 });
  }

  return result;
}
