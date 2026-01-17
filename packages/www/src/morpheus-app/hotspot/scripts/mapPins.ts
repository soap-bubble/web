import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ScriptResult } from './index';

const RED_PUSH_PIN = 2458;
const FUSCIA_PUSH_PIN = 2459;
const GREEN_PUSH_PIN = 2460;
const YELLOW_PUSH_PIN = 2461;
const BLUE_PUSH_PIN = 2462;
const AQUA_PUSH_PIN = 2463;
export const id = 1006;

function createResult(hotspot: Hotspot): ScriptResult {
  return {
    gamestateUpdates: [],
    allDone: !hotspot.defaultPass,
  };
}

export function execute(hotspot: Hotspot, gamestates: GamestatesAccessor): ScriptResult {
  const result = createResult(hotspot);
  const updates = result.gamestateUpdates;
  const { value: mapTest1 } = gamestates.byId(hotspot.param1);
  const { value: pinTest1 } = gamestates.byId(RED_PUSH_PIN);
  const { value: pinTest2 } = gamestates.byId(FUSCIA_PUSH_PIN);
  const { value: pinTest3 } = gamestates.byId(GREEN_PUSH_PIN);
  const { value: pinTest4 } = gamestates.byId(YELLOW_PUSH_PIN);
  const { value: pinTest5 } = gamestates.byId(BLUE_PUSH_PIN);
  const { value: pinTest6 } = gamestates.byId(AQUA_PUSH_PIN);

  if (mapTest1 === 0) {
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest2 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
  }

  if (mapTest1 === 1) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest2 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
    updates.push({ stateId: RED_PUSH_PIN, value: 1 });
  }

  if (mapTest1 === 2) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
    updates.push({ stateId: FUSCIA_PUSH_PIN, value: 1 });
  }

  if (mapTest1 === 3) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
    updates.push({ stateId: GREEN_PUSH_PIN, value: 1 });
  }

  if (mapTest1 === 4) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest2 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
    updates.push({ stateId: YELLOW_PUSH_PIN, value: 1 });
  }

  if (mapTest1 === 5) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest2 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest6 === 1) {
      updates.push({ stateId: AQUA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 6 });
    }
    updates.push({ stateId: BLUE_PUSH_PIN, value: 1 });
  }

  if (mapTest1 === 6) {
    updates.push({ stateId: hotspot.param1, value: 0 });
    if (pinTest1 === 1) {
      updates.push({ stateId: RED_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 1 });
    }
    if (pinTest2 === 1) {
      updates.push({ stateId: FUSCIA_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 2 });
    }
    if (pinTest3 === 1) {
      updates.push({ stateId: GREEN_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 3 });
    }
    if (pinTest4 === 1) {
      updates.push({ stateId: YELLOW_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 4 });
    }
    if (pinTest5 === 1) {
      updates.push({ stateId: BLUE_PUSH_PIN, value: 2 });
      updates.push({ stateId: hotspot.param1, value: 5 });
    }
    updates.push({ stateId: AQUA_PUSH_PIN, value: 1 });
  }

  return result;
}
