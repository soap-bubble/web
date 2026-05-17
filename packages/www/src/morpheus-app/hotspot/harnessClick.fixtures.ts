import type { Gamestate, Hotspot, Scene } from 'morpheus/casts/types';

import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';

export function createGamestatesAccessor(
  values: Record<number, Partial<Gamestate>>,
): GamestatesAccessor {
  return {
    byId(id: number) {
      const value = values[id];
      if (!value) {
        throw new Error(`Missing fixture gamestate ${id}`);
      }
      return {
        stateId: id,
        initialValue: 0,
        minValue: 0,
        maxValue: 10,
        stateWraps: 0,
        value: 0,
        ...value,
      };
    },
  };
}

export function createHotspot(overrides: Partial<Hotspot>): Hotspot {
  return {
    __t: 'Hotspot',
    castId: 1,
    rectTop: 10,
    rectBottom: 30,
    rectLeft: 20,
    rectRight: 60,
    cursorShapeWhenActive: 10002,
    param1: 0,
    param2: 0,
    param3: 0,
    type: 14,
    gesture: 2,
    defaultPass: false,
    initiallyEnabled: true,
    comparators: [],
    ...overrides,
  };
}

export function createScene(casts: Hotspot[]): Scene {
  return {
    sceneId: 1050,
    cdFlags: 0,
    sceneType: 1,
    palette: 0,
    casts,
  };
}
